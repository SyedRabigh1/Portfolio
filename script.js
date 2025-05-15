// Theme Management
const themeToggle = document.createElement('button');
themeToggle.className = 'theme-toggle';
themeToggle.setAttribute('aria-label', 'Toggle theme');
themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
document.body.appendChild(themeToggle);

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.body.classList.add(savedTheme);
    updateThemeIcon();
}

// Theme toggle functionality
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    updateThemeIcon();
});

function updateThemeIcon() {
    const icon = themeToggle.querySelector('i');
    icon.className = document.body.classList.contains('dark') ? 'fas fa-sun' : 'fas fa-moon';
}

// Mobile Menu
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const navItems = document.querySelectorAll('.nav-links a');

hamburger.addEventListener('click', () => {
    const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', !isExpanded);
    navLinks.classList.toggle('active');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        hamburger.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('active');
    }
});

// Close mobile menu when clicking a link
navItems.forEach(item => {
    item.addEventListener('click', () => {
        hamburger.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('active');
    });
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Form Validation
const contactForm = document.getElementById('contact-form');
const formInputs = contactForm.querySelectorAll('input, textarea');

formInputs.forEach(input => {
    input.addEventListener('input', () => {
        validateInput(input);
    });

    input.addEventListener('blur', () => {
        validateInput(input);
    });
});

function validateInput(input) {
    const value = input.value.trim();
    const errorMessage = input.nextElementSibling;

    if (input.hasAttribute('required') && !value) {
        showError(input, 'This field is required');
    } else if (input.type === 'email' && value && !isValidEmail(value)) {
        showError(input, 'Please enter a valid email address');
    } else {
        clearError(input);
    }
}

function showError(input, message) {
    const formGroup = input.parentElement;
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = message;
    formGroup.appendChild(errorMessage);
    input.setAttribute('aria-invalid', 'true');
}

function clearError(input) {
    const formGroup = input.parentElement;
    const errorMessage = formGroup.querySelector('.error-message');
    if (errorMessage) {
        formGroup.removeChild(errorMessage);
    }
    input.setAttribute('aria-invalid', 'false');
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Form Submission
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate all inputs
    let isValid = true;
    formInputs.forEach(input => {
        validateInput(input);
        if (input.getAttribute('aria-invalid') === 'true') {
            isValid = false;
        }
    });

    if (!isValid) return;

    // Show loading state
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="loading-spinner"></span> Sending...';

    try {
        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = 'Message sent successfully!';
        contactForm.appendChild(successMessage);
        
        // Reset form
        contactForm.reset();
        formInputs.forEach(input => {
            input.nextElementSibling.style.top = '1rem';
        });
        
        // Remove success message after 3 seconds
        setTimeout(() => {
            successMessage.remove();
        }, 3000);
    } catch (error) {
        // Show error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Failed to send message. Please try again.';
        contactForm.appendChild(errorMessage);
        
        // Remove error message after 3 seconds
        setTimeout(() => {
            errorMessage.remove();
        }, 3000);
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
});

// Scroll to Top Button
const scrollToTopBtn = document.createElement('button');
scrollToTopBtn.className = 'scroll-to-top';
scrollToTopBtn.setAttribute('aria-label', 'Scroll to top');
scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
document.body.appendChild(scrollToTopBtn);

let lastScrollTop = 0;
window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Show/hide button based on scroll position
    if (scrollTop > 300) {
        scrollToTopBtn.style.opacity = '1';
        scrollToTopBtn.style.visibility = 'visible';
    } else {
        scrollToTopBtn.style.opacity = '0';
        scrollToTopBtn.style.visibility = 'hidden';
    }
    
    // Update button position based on scroll direction
    if (scrollTop > lastScrollTop) {
        scrollToTopBtn.style.bottom = '2rem';
    } else {
        scrollToTopBtn.style.bottom = '3rem';
    }
    
    lastScrollTop = scrollTop;
});

scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Intersection Observer for Animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: [0.1, 0.5]
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = entry.target;
            const delay = target.dataset.delay || 0;
            
            setTimeout(() => {
                target.classList.add('animate');
                if (target.classList.contains('skill-card')) {
                    const skillBar = target.querySelector('.skill-bar');
                    if (skillBar) {
                        skillBar.style.width = skillBar.dataset.level + '%';
                    }
                }
            }, delay);
            
            if (entry.intersectionRatio >= 0.5) {
                observer.unobserve(target);
            }
        }
    });
}, observerOptions);

// Observe all animated elements
document.querySelectorAll('.skill-card, .project-card, .education-item, .experience-item').forEach(element => {
    observer.observe(element);
});

// Loading Animation
window.addEventListener('load', () => {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.classList.add('hidden');
        setTimeout(() => {
            loading.remove();
        }, 500);
    }
});

// Initialize all features
document.addEventListener('DOMContentLoaded', () => {
    // Add loading animation
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loading);
});

// Enhanced CTA Buttons Functionality
const ctaButtons = document.querySelectorAll('.cta-buttons .btn');
const contactSection = document.getElementById('contact');
const projectsSection = document.getElementById('projects');

// Add hover and click effects to CTA buttons
ctaButtons.forEach(button => {
    // Add ripple effect
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        button.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            ripple.remove();
        }, 600);
        
        // Handle button click
        const target = button.getAttribute('href');
        if (target === '#contact') {
            scrollToSection(contactSection);
        } else if (target === '#projects') {
            scrollToSection(projectsSection);
        }
    });
    
    // Add hover animation
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-5px)';
        button.style.boxShadow = 'var(--shadow-lg)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = 'var(--shadow-md)';
    });
});

// Enhanced smooth scrolling function
function scrollToSection(section) {
    const headerOffset = 80;
    const elementPosition = section.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
    
    // Add visual feedback to the section
    section.style.animation = 'highlight 1s ease';
    setTimeout(() => {
        section.style.animation = '';
    }, 1000);
}

// Theme Toggle Functionality
const themeToggleMobile = document.querySelector('.theme-toggle-mobile');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

function setTheme(isDark) {
    document.body.classList.toggle('dark', isDark);
    const icon = themeToggle.querySelector('i');
    const iconMobile = themeToggleMobile.querySelector('i');
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    iconMobile.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Initialize theme
const savedThemeMobile = localStorage.getItem('theme');
if (savedThemeMobile) {
    setTheme(savedThemeMobile === 'dark');
} else {
    setTheme(prefersDarkScheme.matches);
}

// Theme toggle event listeners
[themeToggle, themeToggleMobile].forEach(toggle => {
    if (toggle) {
        toggle.addEventListener('click', () => {
            const isDark = document.body.classList.contains('dark');
            setTheme(!isDark);
        });
    }
});

// Listen for system theme changes
prefersDarkScheme.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        setTheme(e.matches);
    }
});
