#!/bin/bash

# Olumba Production Deployment Script
# This script helps automate the deployment process

set -e  # Exit on any error

echo "🚀 Olumba Production Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        print_error "curl is not installed"
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ] || [ ! -f "vercel.json" ]; then
        print_error "Not in Olumba project directory"
        exit 1
    fi
    print_success "In correct project directory"
}

# Check git status
check_git_status() {
    print_status "Checking git status..."
    
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "Uncommitted changes detected"
        read -p "Do you want to commit changes? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            read -p "Enter commit message: " commit_message
            git commit -m "${commit_message:-Deploy to production}"
            print_success "Changes committed"
        else
            print_error "Please commit changes before deploying"
            exit 1
        fi
    fi
    
    print_success "Git status is clean"
}

# Test local build
test_build() {
    print_status "Testing local build..."
    
    if npm run build; then
        print_success "Build test passed"
    else
        print_error "Build test failed"
        exit 1
    fi
}

# Check environment variables
check_env_vars() {
    print_status "Checking environment variables..."
    
    if [ -f ".env" ]; then
        print_success "Environment file found"
        
        # Check for required variables
        required_vars=("SUPABASE_URL" "CLERK_SECRET_KEY" "RESEND_API_KEY")
        
        for var in "${required_vars[@]}"; do
            if grep -q "^${var}=" .env; then
                print_success "${var} is configured"
            else
                print_warning "${var} is not configured in .env"
            fi
        done
    else
        print_warning "No .env file found - make sure to configure environment variables in Vercel"
    fi
}

# Push to GitHub
push_to_github() {
    print_status "Pushing to GitHub..."
    
    if git push origin main; then
        print_success "Code pushed to GitHub"
    else
        print_error "Failed to push to GitHub"
        exit 1
    fi
}

# Test production endpoints
test_production() {
    local domain=${1:-"https://olumba.app"}
    
    print_status "Testing production endpoints..."
    
    # Test health endpoint
    if curl -f "${domain}/api/health" > /dev/null 2>&1; then
        print_success "Health endpoint is responding"
    else
        print_warning "Health endpoint is not responding - deployment may still be in progress"
    fi
    
    # Test status endpoint
    if curl -f "${domain}/api/status" > /dev/null 2>&1; then
        print_success "Status endpoint is responding"
    else
        print_warning "Status endpoint is not responding"
    fi
}

# Main deployment function
deploy() {
    print_status "Starting deployment process..."
    
    check_dependencies
    check_directory
    check_git_status
    test_build
    check_env_vars
    
    # Ask for confirmation
    echo
    print_warning "Ready to deploy to production!"
    echo "This will:"
    echo "1. Push code to GitHub"
    echo "2. Trigger Vercel deployment"
    echo "3. Test production endpoints"
    echo
    
    read -p "Continue with deployment? (y/n): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled"
        exit 0
    fi
    
    push_to_github
    
    print_status "Deployment triggered!"
    print_status "Check Vercel dashboard for deployment progress: https://vercel.com/dashboard"
    
    # Wait a bit for deployment
    print_status "Waiting for deployment to complete..."
    sleep 30
    
    # Test production
    test_production
    
    print_success "Deployment process completed!"
    print_status "Next steps:"
    echo "1. Check Vercel dashboard for deployment status"
    echo "2. Verify all environment variables are set"
    echo "3. Test all functionality on production domain"
    echo "4. Monitor for any issues"
    echo
    print_success "Olumba is now live! 🎉"
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  deploy     Deploy to production"
    echo "  test       Test production endpoints"
    echo "  check      Run pre-deployment checks"
    echo "  help       Show this help message"
    echo
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 test https://olumba.app"
    echo "  $0 check"
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "test")
        test_production "${2:-https://olumba.app}"
        ;;
    "check")
        check_dependencies
        check_directory
        check_git_status
        test_build
        check_env_vars
        print_success "All checks passed!"
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
