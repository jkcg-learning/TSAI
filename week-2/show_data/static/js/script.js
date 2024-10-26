function handleAnimalSelection() {
    const selectedAnimal = document.querySelector('input[name="animal"]:checked');
    if (selectedAnimal) {
        displayAnimalImage(selectedAnimal.value);
        clearFileUpload();
    } else {
        alert('Please select an animal.');
    }
}

function handleFileUpload() {
    const fileInput = document.getElementById('file-upload');
    if (fileInput.files.length > 0) {
        uploadFile();
        clearAnimalSelection();
    } else {
        alert('Please select a file to upload.');
    }
}

function displayAnimalImage(animal) {
    const imageContainer = document.getElementById('image-container');
    const infoContainer = document.getElementById('info-container');
    
    imageContainer.innerHTML = `<img src="/static/images/${animal}.jpg" alt="${animal}">`;
    infoContainer.innerHTML = `<p>Selected animal: ${animal}</p>`;
}

function uploadFile() {
    const fileInput = document.getElementById('file-upload');
    const file = fileInput.files[0];
    
    const formData = new FormData();
    formData.append('file', file);
    
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        displayUploadedImage(file, data);
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('info-container').innerHTML = '<p>An error occurred while uploading the file.</p>';
    });
}

function displayUploadedImage(file, data) {
    const imageContainer = document.getElementById('image-container');
    const infoContainer = document.getElementById('info-container');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        imageContainer.innerHTML = `<img src="${e.target.result}" alt="Uploaded image">`;
    }
    reader.readAsDataURL(file);
    
    infoContainer.innerHTML = `
        <p>Name: ${data.name}</p>
        <p>Size: ${data.size}</p>
        <p>Type: ${data.type.split('/')[1]}</p>
    `;
}

function clearAnimalSelection() {
    const animalRadios = document.querySelectorAll('input[name="animal"]');
    animalRadios.forEach(radio => {
        radio.checked = false;
    });
}

function clearFileUpload() {
    const fileInput = document.getElementById('file-upload');
    fileInput.value = '';
}

function clearResult() {
    const imageContainer = document.getElementById('image-container');
    const infoContainer = document.getElementById('info-container');
    imageContainer.innerHTML = '';
    infoContainer.innerHTML = '';
}

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
    const animalRadios = document.querySelectorAll('input[name="animal"]');
    const fileInput = document.getElementById('file-upload');

    animalRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                clearFileUpload();
                clearResult();
            }
        });
    });

    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            clearAnimalSelection();
            clearResult();
        }
    });
});