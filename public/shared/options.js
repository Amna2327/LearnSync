// Common options for dropdowns across the application

export const educationLevels = [
    "Elementary School",
    "Middle School", 
    "High School",
    "Undergraduate",
    "Graduate",
    "Postgraduate",
    "Professional Development"
];

export const subjects = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Programming",
    "Data Science",
    "Statistics",
    "English",
    "Literature",
    "History",
    "Geography",
    "Economics",
    "Business",
    "Accounting",
    "Finance",
    "Psychology",
    "Sociology",
    "Philosophy",
    "Art",
    "Music",
    "Foreign Languages",
    "Spanish",
    "French",
    "German",
    "Chinese",
    "Japanese",
    "Engineering",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Civil Engineering",
    "Medicine",
    "Law",
    "Architecture",
    "Design"
];

export const sessionDurations = [
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
    { value: 180, label: "3 hours" }
];

// Helper function to create multi-select with checkboxes
export function createMultiSelect(containerId, options, selectedValues = []) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'multi-select-wrapper';
    wrapper.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.5rem; margin-top: 0.5rem;';
    
    options.forEach(option => {
        const label = document.createElement('label');
        label.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem; border-radius: 8px; transition: background 0.2s;';
        label.onmouseover = () => label.style.background = 'var(--lighter)';
        label.onmouseout = () => label.style.background = 'transparent';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = option;
        checkbox.checked = selectedValues.includes(option);
        checkbox.style.cssText = 'cursor: pointer;';
        
        const span = document.createElement('span');
        span.textContent = option;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        wrapper.appendChild(label);
    });
    
    container.appendChild(wrapper);
    
    // Return function to get selected values
    return () => {
        return Array.from(wrapper.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.value);
    };
}

// Helper function to populate a select dropdown
export function populateSelect(selectId, options, placeholder = "Select an option") {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Clear existing options except placeholder
    const firstOption = select.querySelector('option[value=""]');
    select.innerHTML = '';
    
    if (placeholder) {
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = placeholder;
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        select.appendChild(placeholderOption);
    }
    
    options.forEach(option => {
        const opt = document.createElement('option');
        if (typeof option === 'object') {
            opt.value = option.value;
            opt.textContent = option.label;
        } else {
            opt.value = option;
            opt.textContent = option;
        }
        select.appendChild(opt);
    });
}

// Helper function to create editable dropdown (combobox) using datalist
export function createEditableSelect(selectId, options, placeholder = "Type or select...") {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Get parent container
    const parent = select.parentElement;
    const label = parent.querySelector('label');
    
    // Create datalist ID
    const datalistId = selectId + '_datalist';
    
    // Create datalist element
    let datalist = document.getElementById(datalistId);
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = datalistId;
        document.body.appendChild(datalist);
    }
    datalist.innerHTML = '';
    
    // Populate datalist with options
    options.forEach(option => {
        const opt = document.createElement('option');
        if (typeof option === 'object') {
            opt.value = option.value;
            opt.textContent = option.label;
        } else {
            opt.value = option;
            opt.textContent = option;
        }
        datalist.appendChild(opt);
    });
    
    // Replace select with input + datalist
    const input = document.createElement('input');
    input.type = 'text';
    input.id = selectId;
    input.name = select.name || selectId;
    input.required = select.required;
    input.placeholder = placeholder;
    input.value = select.value || '';
    input.setAttribute('list', datalistId);
    input.className = select.className;
    input.style.cssText = getComputedStyle(select).cssText;
    
    // Copy all attributes
    Array.from(select.attributes).forEach(attr => {
        if (attr.name !== 'id' && attr.name !== 'name' && attr.name !== 'type') {
            input.setAttribute(attr.name, attr.value);
        }
    });
    
    // Replace select with input
    select.replaceWith(input);
    
    return input;
}

