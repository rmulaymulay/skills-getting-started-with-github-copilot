const activitiesList = document.getElementById("activities-list");
const activitySelect = document.getElementById("activity");
const signupForm = document.getElementById("signup-form");
const messageDiv = document.getElementById("message");

// Fetch and display activities
async function loadActivities() {
  try {
    const response = await fetch('/activities');
    const activities = await response.json();
    
    activitiesList.innerHTML = '';
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
    
    for (const [name, details] of Object.entries(activities)) {
      // Create activity card
      const card = document.createElement('div');
      card.className = 'activity-card';
      
      const spotsAvailable = details.max_participants - details.participants.length;
      
      card.innerHTML = `
        <h4>${name}</h4>
        <p><strong>Description:</strong> ${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Capacity:</strong> ${details.participants.length}/${details.max_participants} (${spotsAvailable} spots available)</p>
        <div class="participants-section">
          <p><strong>Participants:</strong></p>
          <ul class="participants-list">
            ${details.participants.length > 0 
              ? details.participants.map(email => `
                <li>
                  <span class="participant-email">${email}</span>
                  <button class="delete-btn" data-activity="${name}" data-email="${email}" title="Unregister participant">✖</button>
                </li>
              `).join('') 
              : '<li class="no-participants">No participants yet</li>'}
          </ul>
        </div>
      `;
      
      activitiesList.appendChild(card);
      
      // Add to select dropdown
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    }
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', handleUnregister);
    });
  } catch (error) {
    console.error('Error loading activities:', error);
    activitiesList.innerHTML = '<p class="error">Failed to load activities</p>';
  }
}

// Handle participant unregistration
async function handleUnregister(e) {
  const activity = e.target.getAttribute('data-activity');
  const email = e.target.getAttribute('data-email');
  
  if (!confirm(`Are you sure you want to unregister ${email} from ${activity}?`)) {
    return;
  }
  
  try {
    const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Reload activities to reflect the change
      await loadActivities();
      
      // Show success message
      messageDiv.className = 'message success';
      messageDiv.textContent = data.message;
      messageDiv.classList.remove('hidden');
      
      // Hide message after 3 seconds
      setTimeout(() => {
        messageDiv.classList.add('hidden');
      }, 3000);
    } else {
      alert(data.detail || 'Failed to unregister participant');
    }
  } catch (error) {
    console.error('Error unregistering participant:', error);
    alert('Failed to unregister participant. Please try again.');
  }
}

// Handle form submission
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const activity = document.getElementById('activity').value;
  
  if (!activity) {
    messageDiv.className = 'message error';
    messageDiv.textContent = 'Please select an activity';
    messageDiv.classList.remove('hidden');
    return;
  }
  
  try {
    const response = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      messageDiv.className = 'message success';
      messageDiv.textContent = data.message;
      messageDiv.classList.remove('hidden');
      
      // Reset form and reload activities
      signupForm.reset();
      await loadActivities();
    } else {
      messageDiv.className = 'message error';
      messageDiv.textContent = data.detail || 'An error occurred';
      messageDiv.classList.remove('hidden');
    }
  } catch (error) {
    messageDiv.className = 'message error';
    messageDiv.textContent = 'Failed to sign up. Please try again.';
    messageDiv.classList.remove('hidden');
  }
});

// Load activities on page load
loadActivities();
