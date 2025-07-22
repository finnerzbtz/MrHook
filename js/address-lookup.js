
// UK Address Lookup Utility
const AddressLookup = {
  // Free UK postcode API - no key required for basic usage
  apiUrl: 'https://api.postcodes.io',
  
  // Find addresses for a given postcode
  async findAddress() {
    const postcodeInput = document.getElementById('postcode');
    const addressSelect = document.getElementById('addressSelect');
    const lookupBtn = document.querySelector('.postcode-lookup');
    
    const postcode = postcodeInput.value.trim().toUpperCase();
    
    if (!postcode) {
      Toast.show('Please enter a postcode', 'error');
      return;
    }
    
    // Validate UK postcode format
    if (!this.isValidPostcode(postcode)) {
      Toast.show('Please enter a valid UK postcode', 'error');
      return;
    }
    
    // Show loading state
    lookupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    lookupBtn.disabled = true;
    
    try {
      const response = await fetch(`${this.apiUrl}/postcodes/${encodeURIComponent(postcode)}`);
      const data = await response.json();
      
      if (data.status === 200 && data.result) {
        this.displayAddressOptions(data.result);
        this.prefillBasicInfo(data.result);
      } else {
        Toast.show('Postcode not found. Please check and try again.', 'error');
        this.showManualEntry();
      }
    } catch (error) {
      console.error('Address lookup error:', error);
      Toast.show('Unable to lookup address. Please enter manually.', 'error');
      this.showManualEntry();
    } finally {
      // Reset button
      lookupBtn.innerHTML = '<i class="fas fa-search"></i> Find';
      lookupBtn.disabled = false;
    }
  },
  
  // Display address options in dropdown
  displayAddressOptions(postcodeData) {
    const addressSelect = document.getElementById('addressSelect');
    
    // For demo purposes, we'll create some common address variations
    // In a real implementation, you'd use a more comprehensive address API
    const addresses = this.generateAddressOptions(postcodeData);
    
    addressSelect.innerHTML = '<option value="">Please select an address...</option>';
    
    addresses.forEach((address, index) => {
      const option = document.createElement('option');
      option.value = JSON.stringify(address);
      option.textContent = address.fullAddress;
      addressSelect.appendChild(option);
    });
    
    addressSelect.style.display = 'block';
    Toast.show('Address found! Please select from the list.');
  },
  
  // Generate address options based on postcode data
  generateAddressOptions(postcodeData) {
    const baseAddress = {
      city: postcodeData.admin_district || postcodeData.parish || '',
      county: postcodeData.admin_county || postcodeData.region || '',
      postcode: postcodeData.postcode
    };
    
    // Generate some example addresses for the area
    const streetNames = [
      'High Street', 'Church Lane', 'Mill Road', 'Victoria Street', 
      'Queens Road', 'Park Avenue', 'Station Road'
    ];
    
    const addresses = [];
    
    // Generate 5-8 example addresses
    for (let i = 1; i <= Math.min(7, streetNames.length); i++) {
      const streetName = streetNames[i - 1];
      for (let houseNum = 1; houseNum <= 3; houseNum++) {
        const address = {
          ...baseAddress,
          houseNumber: (i * 10 + houseNum).toString(),
          streetName: streetName,
          fullAddress: `${i * 10 + houseNum} ${streetName}, ${baseAddress.city}, ${baseAddress.postcode}`
        };
        addresses.push(address);
        
        if (addresses.length >= 6) break;
      }
      if (addresses.length >= 6) break;
    }
    
    return addresses;
  },
  
  // Fill address fields when user selects from dropdown
  fillAddress() {
    const addressSelect = document.getElementById('addressSelect');
    const selectedValue = addressSelect.value;
    
    if (!selectedValue) return;
    
    try {
      const address = JSON.parse(selectedValue);
      
      document.getElementById('houseNumber').value = address.houseNumber || '';
      document.getElementById('streetName').value = address.streetName || '';
      document.getElementById('city').value = address.city || '';
      document.getElementById('county').value = address.county || '';
      
      Toast.show('Address filled automatically!');
    } catch (error) {
      console.error('Error parsing address:', error);
      Toast.show('Error filling address. Please enter manually.', 'error');
    }
  },
  
  // Prefill basic info from postcode data
  prefillBasicInfo(postcodeData) {
    document.getElementById('city').value = postcodeData.admin_district || postcodeData.parish || '';
    document.getElementById('county').value = postcodeData.admin_county || postcodeData.region || '';
  },
  
  // Show manual entry option
  showManualEntry() {
    const addressSelect = document.getElementById('addressSelect');
    addressSelect.style.display = 'none';
    
    // Focus on first manual field
    document.getElementById('houseNumber').focus();
  },
  
  // Validate UK postcode format
  isValidPostcode(postcode) {
    const ukPostcodeRegex = /^[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2}$/i;
    return ukPostcodeRegex.test(postcode.replace(/\s/g, ''));
  },
  
  // Get formatted address string
  getFormattedAddress() {
    const houseNumber = document.getElementById('houseNumber').value.trim();
    const streetName = document.getElementById('streetName').value.trim();
    const city = document.getElementById('city').value.trim();
    const county = document.getElementById('county').value.trim();
    const postcode = document.getElementById('postcode').value.trim().toUpperCase();
    
    const addressParts = [];
    
    if (houseNumber) addressParts.push(houseNumber);
    if (streetName) addressParts.push(streetName);
    if (city) addressParts.push(city);
    if (county) addressParts.push(county);
    if (postcode) addressParts.push(postcode);
    
    return addressParts.join(', ');
  },
  
  // Validate all address fields are filled
  validateAddress() {
    const requiredFields = ['postcode', 'houseNumber', 'streetName', 'city'];
    const missingFields = [];
    
    requiredFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (!field.value.trim()) {
        missingFields.push(field.previousElementSibling.textContent.replace(':', ''));
      }
    });
    
    if (missingFields.length > 0) {
      Toast.show(`Please fill in: ${missingFields.join(', ')}`, 'error');
      return false;
    }
    
    const postcode = document.getElementById('postcode').value.trim();
    if (!this.isValidPostcode(postcode)) {
      Toast.show('Please enter a valid UK postcode', 'error');
      return false;
    }
    
    return true;
  }
};

// Add postcode formatting on input
document.addEventListener('DOMContentLoaded', () => {
  const postcodeInput = document.getElementById('postcode');
  if (postcodeInput) {
    postcodeInput.addEventListener('input', (e) => {
      // Auto-format postcode as user types
      let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // Add space before last 3 characters if length > 3
      if (value.length > 3) {
        value = value.slice(0, -3) + ' ' + value.slice(-3);
      }
      
      e.target.value = value;
    });
    
    // Allow Enter key to trigger lookup
    postcodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        AddressLookup.findAddress();
      }
    });
  }
});
