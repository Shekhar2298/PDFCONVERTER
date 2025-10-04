// Initialize jsPDF
const { jsPDF } = window.jspdf;

// DOM Elements
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const previewSection = document.getElementById('preview');
const imageList = document.getElementById('imageList');
const addMoreBtn = document.getElementById('addMoreBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const convertBtn = document.getElementById('convertBtn');
const downloadBtn = document.getElementById('downloadBtn');

// Store uploaded images
let uploadedImages = [];

// Event Listeners
browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
addMoreBtn.addEventListener('click', () => fileInput.click());
clearAllBtn.addEventListener('click', clearAllImages);
convertBtn.addEventListener('click', convertToPDF);
downloadBtn.addEventListener('click', downloadPDF);

// Drag and drop functionality
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropArea.classList.add('dragover');
}

function unhighlight() {
    dropArea.classList.remove('dragover');
}

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.match('image.*')) {
            const reader = new FileReader();
            
            reader.onload = (function(theFile) {
                return function(e) {
                    // Create image object with data and original file
                    const imageObj = {
                        data: e.target.result,
                        file: theFile,
                        id: Date.now() + Math.random()
                    };
                    
                    uploadedImages.push(imageObj);
                    displayImage(imageObj);
                    
                    // Show preview section if not already visible
                    if (previewSection.style.display === 'none') {
                        previewSection.style.display = 'block';
                    }
                };
            })(file);
            
            reader.readAsDataURL(file);
        }
    }
}

function displayImage(imageObj) {
    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';
    imageItem.setAttribute('data-id', imageObj.id);
    
    const img = document.createElement('img');
    img.src = imageObj.data;
    
    const imageActions = document.createElement('div');
    imageActions.className = 'image-actions';
    
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '❌';
    removeBtn.addEventListener('click', () => removeImage(imageObj.id));
    
    imageActions.appendChild(removeBtn);
    imageItem.appendChild(img);
    imageItem.appendChild(imageActions);
    
    imageList.appendChild(imageItem);
}

function removeImage(id) {
    // Remove from array
    uploadedImages = uploadedImages.filter(img => img.id !== id);
    
    // Remove from DOM
    const imageElement = document.querySelector(`.image-item[data-id="${id}"]`);
    if (imageElement) {
        imageElement.remove();
    }
    
    // Hide preview section if no images left
    if (uploadedImages.length === 0) {
        previewSection.style.display = 'none';
    }
}

function clearAllImages() {
    uploadedImages = [];
    imageList.innerHTML = '';
    previewSection.style.display = 'none';
}

function convertToPDF() {
    if (uploadedImages.length === 0) {
        alert('Please add at least one image to convert.');
        return;
    }

    // Show loading state
    convertBtn.textContent = 'Converting...';
    convertBtn.disabled = true;

    // Get PDF options
    const pageSize = document.getElementById('pageSize').value;
    const orientation = document.getElementById('orientation').value;
    const margin = parseInt(document.getElementById('margin').value);
    const compress = document.getElementById('compress').checked;

    // Create PDF
    const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: pageSize
    });

    let processedImages = 0;

    // Process each image
    uploadedImages.forEach((imageObj, index) => {
        if (index > 0) {
            pdf.addPage();
        }

        // Calculate dimensions to fit image on page with margins
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        const img = new Image();
        img.src = imageObj.data;
        
        // Wait for image to load
        img.onload = function() {
            const imgWidth = img.width;
            const imgHeight = img.height;
            
            const ratio = Math.min(
                (pageWidth - margin * 2) / imgWidth,
                (pageHeight - margin * 2) / imgHeight
            );
            
            const width = imgWidth * ratio;
            const height = imgHeight * ratio;
            
            const x = (pageWidth - width) / 2;
            const y = (pageHeight - height) / 2;
            
            pdf.addImage(img, 'JPEG', x, y, width, height);
            
            processedImages++;
            
            // If all images are processed, enable download button
            if (processedImages === uploadedImages.length) {
                // Save PDF
                const pdfOutput = pdf.output('blob');
                const pdfUrl = URL.createObjectURL(pdfOutput);
                
                // Enable download button
                downloadBtn.style.display = 'inline-block';
                downloadBtn.setAttribute('data-pdf-url', pdfUrl);
                downloadBtn.setAttribute('download', 'converted-images.pdf');
                
                // Reset convert button
                convertBtn.textContent = 'Convert Again';
                convertBtn.disabled = false;
                
                // Scroll to download button
                downloadBtn.scrollIntoView({ behavior: 'smooth' });
            }
        };
    });
}

// SEO: Track conversions and user engagement
class SEOAnalytics {
    constructor() {
        this.conversionCount = 0;
        this.init();
    }

    init() {
        // Track conversions
        document.getElementById('convertBtn').addEventListener('click', () => {
            this.trackConversion();
        });

        // Track downloads
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.trackDownload();
        });
    }

    trackConversion() {
        this.conversionCount++;
        // You can send this data to analytics
        console.log(`Conversion tracked: ${this.conversionCount}`);
    }

    trackDownload() {
        // Track successful downloads
        if (typeof gtag !== 'undefined') {
            gtag('event', 'download', {
                'event_category': 'conversion',
                'event_label': 'pdf_download'
            });
        }
    }
}

// Initialize SEO analytics
new SEOAnalytics();

// Schema.org structured data for SEO
function addStructuredData() {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Image to PDF Converter",
        "description": "Free online tool to convert images to PDF documents",
        "url": "https://yourdomain.com",
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "Any",
        "permissions": "browser",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
}

// Call on page load
document.addEventListener('DOMContentLoaded', addStructuredData);

function downloadPDF() {
    const pdfUrl = downloadBtn.getAttribute('data-pdf-url');
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'converted-images.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}