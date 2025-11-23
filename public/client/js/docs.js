// Initialize syntax highlighting
document.addEventListener('DOMContentLoaded', function() {
  // Highlight all code blocks
  hljs.highlightAll();
  
  // Smooth scroll for sidebar links
  const sidebarLinks = document.querySelectorAll('.docs-sidebar a');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Update active state
        sidebarLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        // Update URL without scrolling
        history.pushState(null, null, targetId);
      }
    });
  });
  
  // Highlight active section on scroll
  const sections = document.querySelectorAll('.docs-section');
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '-100px 0px -80% 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        sidebarLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, observerOptions);
  
  sections.forEach(section => observer.observe(section));
  
  // Set initial active link based on URL hash
  if (window.location.hash) {
    const activeLink = document.querySelector(`.docs-sidebar a[href="${window.location.hash}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  } else {
    // Default to first link
    if (sidebarLinks.length > 0) {
      sidebarLinks[0].classList.add('active');
    }
  }
});

// Copy code to clipboard
function copyCode(button) {
  const codeBlock = button.closest('.code-block');
  const code = codeBlock.querySelector('code').textContent;
  
  navigator.clipboard.writeText(code).then(() => {
    // Show success feedback
    const icon = button.querySelector('i');
    const originalClass = icon.className;
    
    button.classList.add('copied');
    icon.className = 'fas fa-check';
    button.textContent = '';
    button.appendChild(icon);
    
    setTimeout(() => {
      button.classList.remove('copied');
      icon.className = originalClass;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    alert('Failed to copy code');
  });
}

// Add copy buttons to all code blocks
document.addEventListener('DOMContentLoaded', function() {
  const codeBlocks = document.querySelectorAll('.code-block');
  
  codeBlocks.forEach(block => {
    const copyBtn = block.querySelector('.copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function() {
        copyCode(this);
      });
    }
  });
});

// Search functionality (optional enhancement)
function initSearch() {
  const searchInput = document.getElementById('docs-search');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    const sections = document.querySelectorAll('.docs-section');
    
    sections.forEach(section => {
      const text = section.textContent.toLowerCase();
      if (text.includes(query)) {
        section.style.display = 'block';
      } else {
        section.style.display = 'none';
      }
    });
  });
}

// API Key tester (interactive feature)
function testApiKey() {
  const apiKey = document.getElementById('api-key-input')?.value;
  if (!apiKey) {
    alert('Please enter an API key');
    return;
  }
  
  // Test with a simple endpoint
  fetch('/aqi/history/quan1?limit=1', {
    headers: {
      'x-api-key': apiKey
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Invalid API key: ' + data.error);
      } else {
        alert('API key is valid! ✓');
      }
    })
    .catch(err => {
      alert('Error testing API key: ' + err.message);
    });
}

// Add active class style
const style = document.createElement('style');
style.textContent = `
  .docs-sidebar a.active {
    background: #f1f3f5;
    color: #667eea;
    font-weight: 600;
    padding-left: 1rem;
    border-left: 3px solid #667eea;
  }
`;
document.head.appendChild(style);

// Handle endpoint card clicks
document.addEventListener('DOMContentLoaded', function() {
  const endpointCards = document.querySelectorAll('.endpoint-card');
  
  endpointCards.forEach(card => {
    card.addEventListener('click', function() {
      const name = this.querySelector('.endpoint-name').textContent.toLowerCase();
      let targetId = '';
      
      // Map endpoint names to section IDs
      if (name.includes('so sánh')) targetId = '#compare';
      else if (name.includes('lịch sử')) targetId = '#history';
      else if (name.includes('thời gian')) targetId = '#by-datetime';
      else if (name.includes('thống kê')) targetId = '#statistics';
      else if (name.includes('xu hướng')) targetId = '#trend';
      else if (name.includes('lọc')) targetId = '#filter';
      else if (name.includes('export')) targetId = '#export';
      else if (name.includes('giờ')) targetId = '#hourly-average';
      
      if (targetId) {
        const target = document.querySelector(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
});

// Mobile menu toggle (if needed)
function toggleMobileSidebar() {
  const sidebar = document.querySelector('.docs-sidebar');
  sidebar.classList.toggle('mobile-open');
}

// Add mobile styles
const mobileStyle = document.createElement('style');
mobileStyle.textContent = `
  @media (max-width: 768px) {
    .docs-sidebar {
      display: none;
    }
    
    .docs-sidebar.mobile-open {
      display: block;
      position: fixed;
      top: 80px;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
      background: white;
    }
  }
`;
document.head.appendChild(mobileStyle);
