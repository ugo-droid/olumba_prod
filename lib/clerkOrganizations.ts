// =============================
// Clerk Organizations ↔ Supabase Companies Mapping
// =============================
// Manages the relationship between Clerk Organizations and Supabase companies
// Ensures complete isolation between companies

import { clerkClient } from '@clerk/backend';
import { supabaseAdmin } from './supabaseAdmin';

export interface OrganizationMapping {
  clerk_org_id: string;
  supabase_company_id: string;
  name: string;
  tier?: string;
  billing_status?: string;
}

/**
 * Sync a Clerk organization to Supabase
 * Creates or updates the corresponding company record
 */
export async function syncClerkOrgToSupabase(clerkOrgId: string): Promise<string> {
  try {
    // Get organization from Clerk
    const clerkOrg = await clerkClient.organizations.getOrganization({
      organizationId: clerkOrgId,
    });

    if (!clerkOrg) {
      throw new Error(`Clerk organization ${clerkOrgId} not found`);
    }

    // Check if company already exists in Supabase
    const { data: existing } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('clerk_org_id', clerkOrgId)
      .single();

    if (existing) {
      // Update existing company
      const { error } = await supabaseAdmin
        .from('organizations')
        .update({
          name: clerkOrg.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Failed to update company:', error);
        throw error;
      }

      return existing.id;
    } else {
      // Create new company
      const { data: newCompany, error } = await supabaseAdmin
        .from('organizations')
        .insert({
          clerk_org_id: clerkOrgId,
          name: clerkOrg.name,
          tier: 'starter', // Default tier
          billing_status: 'trial', // Default status
        })
        .select('id')
        .single();

      if (error || !newCompany) {
        console.error('Failed to create company:', error);
        throw error || new Error('Failed to create company');
      }

      // Create default entitlements for new organization
      await createDefaultEntitlements(newCompany.id);

      return newCompany.id;
    }
  } catch (error) {
    console.error('Error syncing Clerk org to Supabase:', error);
    throw error;
  }
}

/**
 * Create default entitlements for a new organization
 */
async function createDefaultEntitlements(organizationId: string): Promise<void> {
  const { error } = await supabaseAdmin.from('organization_entitlements').insert({
    organization_id: organizationId,
    tier: 'starter',
    max_internal_members: 3, // Starter tier limit
    base_storage_gb: 20, // Starter tier storage
    city_integrations: 0,
    extra_storage_gb: 0,
    external_collaborators_billable: false,
  });

  if (error) {
    console.error('Failed to create default entitlements:', error);
    throw error;
  }
}

/**
 * Get Supabase company ID from Clerk organization ID
 */
export async function getCompanyIdFromClerkOrg(clerkOrgId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('clerk_org_id', clerkOrgId)
    .single();

  return data?.id || null;
}

/**
 * Get Clerk organization ID from Supabase company ID
 */
export async function getClerkOrgIdFromCompany(companyId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('organizations')
    .select('clerk_org_id')
    .eq('id', companyId)
    .single();

  return data?.clerk_org_id || null;
}

/**
 * Add user to company in Supabase when they join Clerk organization
 */
export async function addUserToCompany(
  clerkUserId: string,
  clerkOrgId: string,
  role: 'owner' | 'admin' | 'member' = 'member'
): Promise<void> {
  try {
    // Get or create company ID
    let companyId = await getCompanyIdFromClerkOrg(clerkOrgId);
    
    if (!companyId) {
      // Sync organization if it doesn't exist
      companyId = await syncClerkOrgToSupabase(clerkOrgId);
    }

    // Get user from Clerk to get email
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      throw new Error('User has no email address');
    }

    // Check if user already exists in company
    const { data: existing } = await supabaseAdmin
      .from('members')
      .select('id')
      .eq('user_id', clerkUserId)
      .eq('organization_id', companyId)
      .single();

    if (existing) {
      // Update role if changed
      await supabaseAdmin
        .from('members')
        .update({ role })
        .eq('id', existing.id);
    } else {
      // Add new member
      await supabaseAdmin.from('members').insert({
        user_id: clerkUserId,
        organization_id: companyId,
        role,
        email,
      });
    }
  } catch (error) {
    console.error('Error adding user to company:', error);
    throw error;
  }
}

/**
 * Remove user from company when they leave Clerk organization
 */
export async function removeUserFromCompany(
  clerkUserId: string,
  clerkOrgId: string
): Promise<void> {
  try {
    const companyId = await getCompanyIdFromClerkOrg(clerkOrgId);
    
    if (!companyId) {
      console.warn(`Company not found for Clerk org ${clerkOrgId}`);
      return;
    }

    await supabaseAdmin
      .from('members')
      .delete()
      .eq('user_id', clerkUserId)
      .eq('organization_id', companyId);
  } catch (error) {
    console.error('Error removing user from company:', error);
    throw error;
  }
}

/**
 * Get user's companies (organizations)
 */
export async function getUserCompanies(clerkUserId: string): Promise<OrganizationMapping[]> {
  const { data } = await supabaseAdmin
    .from('members')
    .select(`
      organization_id,
      role,
      organizations:organization_id (
        id,
        clerk_org_id,
        name,
        tier,
        billing_status
      )
    `)
    .eq('user_id', clerkUserId);

  if (!data) return [];

  return data.map((member: any) => ({
    clerk_org_id: member.organizations.clerk_org_id,
    supabase_company_id: member.organizations.id,
    name: member.organizations.name,
    tier: member.organizations.tier,
    billing_status: member.organizations.billing_status,
  }));
}

/**
 * Check if user has access to a company
 */
export async function userHasCompanyAccess(
  clerkUserId: string,
  companyId: string
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('members')
    .select('id')
    .eq('user_id', clerkUserId)
    .eq('organization_id', companyId)
    .single();

  return !!data;
}

/**
 * Get user's role in a company
 */
export async function getUserRoleInCompany(
  clerkUserId: string,
  companyId: string
): Promise<'owner' | 'admin' | 'member' | 'external' | null> {
  const { data } = await supabaseAdmin
    .from('members')
    .select('role')
    .eq('user_id', clerkUserId)
    .eq('organization_id', companyId)
    .single();

  return data?.role || null;
}


