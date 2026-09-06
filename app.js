// Auto-fill values when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // 1. Pre-fill Title
    const titleField = document.getElementById('projectTitle');
    titleField.value = "AI-Integrated Learning Management System (LMS)";

    // 2. Pre-fill Summary
    const summaryField = document.getElementById('projectSummary');
    summaryField.value = "Traditional Learning Management Systems (LMS) typically offer a static, one-size-fits-all approach to learning, limiting the effectiveness of self-paced study. This project proposes the development of a smart LMS integrated with AI. Under this system, lecturers can upload lecture notes and course materials, which the AI uses as context to answer student queries 24/7. Additionally, the system provides a collaborative interface where lecturers can directly answer student questions and oversee AI-generated responses. This project aims to enhance student learning outcomes, support personalized education, and streamline teacher-student communication.";

    // 3. Pre-fill Cost
    const costField = document.getElementById('projectCost');
    costField.value = "0.00";
});

// Modal Elements
const modal = document.getElementById('successModal');
const closeBtn = document.querySelector('.close-btn');
const closeModalBtn = document.getElementById('closeModalBtn');

// Form Submit Handler
const form = document.getElementById('projectForm');
form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Extract form fields
    const title = document.getElementById('projectTitle').value;
    const cost = document.getElementById('projectCost').value;
    const supervisorSelect = document.getElementById('supervisor');
    const supervisorText = supervisorSelect.options[supervisorSelect.selectedIndex].text;

    // Set summary details in the modal
    document.getElementById('summaryTitle').textContent = title;
    document.getElementById('summaryCost').textContent = parseFloat(cost).toFixed(2);
    document.getElementById('summarySupervisor').textContent = supervisorText;

    // Show Success Modal
    modal.classList.add('show');
});

// Close Modal Events
const hideModal = () => {
    modal.classList.remove('show');
};

closeBtn.addEventListener('click', hideModal);
closeModalBtn.addEventListener('click', hideModal);

// Close modal when clicking outside of it
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        hideModal();
    }
});
