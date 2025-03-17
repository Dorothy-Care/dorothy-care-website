// Function to toggle between showing and hiding the full description
function toggleReadMore() {
  var fullDescription = document.getElementById('full-description');
  var shortDescription = document.getElementById('short-description');
  var readMoreLink = document.getElementById('read-more');

  if (fullDescription.style.display === 'none') {
    fullDescription.style.display = 'block';
    shortDescription.style.display = 'none';
    readMoreLink.innerHTML = 'Read Less';
  } else {
    fullDescription.style.display = 'none';
    shortDescription.style.display = 'block';
    readMoreLink.innerHTML = 'Read More';
  }
}

// Testimonial Slider
document.addEventListener('DOMContentLoaded', function () {
  const testimonials = document.querySelectorAll('.testimonial-item');
  const prevButton = document.querySelector('.testimonial-prev');
  const nextButton = document.querySelector('.testimonial-next');
  let currentIndex = 0;

  if (!prevButton || !nextButton) {
    console.error('Error: Navigation buttons not found!');
    return;
  }

  function showTestimonial(index) {
    testimonials.forEach((testimonial, i) => {
      testimonial.style.display = i === index ? 'block' : 'none';
    });
  }

  // Show the first testimonial initially
  showTestimonial(currentIndex);

  function nextTestimonial() {
    currentIndex = (currentIndex + 1) % testimonials.length;
    showTestimonial(currentIndex);
  }

  function prevTestimonial() {
    currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
    showTestimonial(currentIndex);
  }

  // Event Listeners for Buttons
  nextButton.addEventListener('click', nextTestimonial);
  prevButton.addEventListener('click', prevTestimonial);
});
