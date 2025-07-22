// Address lookup utility for UK addresses
class AddressLookup {
  // Free UK postcode API - no key required for basic usage
  static apiUrl = 'https://api.postcodes.io';

  // Find addresses for a given postcode
  static async findAddress() {
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
      lookupBtn.innerHTML = 'Lookup';
      lookupBtn.disabled = false;
    }
  }

  // Validate UK postcode format
  static isValidPostcode(postcode) {
    const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
    return postcodeRegex.test(postcode.trim());
  }

  // Display address options
  static displayAddressOptions(result) {
    const addressSelect = document.getElementById('addressSelect');
    if (addressSelect) {
      addressSelect.innerHTML = `
        <option value="">Select an address...</option>
        <option value="manual">Enter address manually</option>
      `;
      addressSelect.style.display = 'block';
    }
  }

  // Prefill basic info from postcode
  static prefillBasicInfo(result) {
    if (result.admin_district) {
      const cityField = document.getElementById('city');
      if (cityField) cityField.value = result.admin_district;
    }

    if (result.admin_county) {
      const countyField = document.getElementById('county');
      if (countyField) countyField.value = result.admin_county;
    }
  }

  // Show manual entry
  static showManualEntry() {
    const addressFields = document.querySelector('.address-fields');
    if (addressFields) {
      addressFields.style.display = 'block';
    }
  }

  // Simple validation for registration
  static validateAddress() {
    const line1 = document.getElementById('addressLine1')?.value.trim();
    const city = document.getElementById('city')?.value.trim();
    const postcode = document.getElementById('postcode')?.value.trim();

    return line1 && city && postcode;
  }

  // Get formatted address for registration
  static getFormattedAddress() {
    return {
      line1: document.getElementById('addressLine1')?.value.trim() || '',
      line2: document.getElementById('addressLine2')?.value.trim() || '',
      city: document.getElementById('city')?.value.trim() || '',
      postcode: document.getElementById('postcode')?.value.trim() || '',
      county: document.getElementById('county')?.value.trim() || '',
      phone: document.getElementById('phone')?.value.trim() || ''
    };
  }
}

// Make it globally available
window.AddressLookup = AddressLookup;