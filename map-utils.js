// map-utils.js - Interactive Map with GPS Location Picker

// Map configuration
const MAP_CONFIG = {
  DEFAULT_CENTER: [18.7883, 98.9853], // Chiang Mai, Thailand
  DEFAULT_ZOOM: 13,
  TILE_LAYER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

// Global map instances
let orderMap = null;
let currentMarker = null;
let selectedLocation = null;

/**
 * Initialize map for location picker
 */
function initLocationPicker(mapElementId, options = {}) {
  const config = {
    center: options.center || MAP_CONFIG.DEFAULT_CENTER,
    zoom: options.zoom || MAP_CONFIG.DEFAULT_ZOOM,
    onLocationSelect: options.onLocationSelect || null
  };
  
  // Create map
  const map = L.map(mapElementId).setView(config.center, config.zoom);
  
  // Add tile layer
  L.tileLayer(MAP_CONFIG.TILE_LAYER, {
    attribution: MAP_CONFIG.ATTRIBUTION,
    maxZoom: 19
  }).addTo(map);
  
  // Add click handler to pick location
  map.on('click', async function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    
    // Remove old marker if exists
    if (currentMarker) {
      map.removeLayer(currentMarker);
    }
    
    // Add new marker
    currentMarker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(map);
    
    // Get address from coordinates
    Loading.show();
    try {
      const address = await reverseGeocode(lat, lng);
      
      // Store selected location
      selectedLocation = {
        lat: lat,
        lng: lng,
        address: address
      };
      
      // Show popup
      currentMarker.bindPopup(`
        <div style="min-width: 200px;">
          <strong>📍 ตำแหน่งที่เลือก</strong><br>
          <small>${address}</small><br><br>
          <button onclick="confirmLocation()" class="btn btn-primary btn-sm" style="width: 100%;">
            ✓ ใช้ตำแหน่งนี้
          </button>
        </div>
      `).openPopup();
      
      // Call callback if provided
      if (config.onLocationSelect) {
        config.onLocationSelect(selectedLocation);
      }
      
    } catch (error) {
      console.error('Error getting address:', error);
      Toast.error('ไม่สามารถดึงข้อมูลที่อยู่ได้');
    } finally {
      Loading.hide();
    }
  });
  
  return map;
}

/**
 * Get current GPS location
 */
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    Loading.show();
    Toast.show('กำลังค้นหาตำแหน่งของคุณ...', 'info', 2000);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        Loading.hide();
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        Loading.hide();
        let errorMessage = 'ไม่สามารถระบุตำแหน่งได้';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'กรุณาอนุญาตให้เข้าถึงตำแหน่ง';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'ไม่พบข้อมูลตำแหน่ง';
            break;
          case error.TIMEOUT:
            errorMessage = 'หมดเวลาในการค้นหาตำแหน่ง';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Reverse geocode: coordinates to address
 */
async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'th,en'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    
    // Format Thai address
    const addr = data.address || {};
    let addressParts = [];
    
    if (addr.house_number) addressParts.push(addr.house_number);
    if (addr.road) addressParts.push(addr.road);
    if (addr.suburb) addressParts.push(addr.suburb);
    if (addr.city || addr.town || addr.village) {
      addressParts.push(addr.city || addr.town || addr.village);
    }
    if (addr.state) addressParts.push(addr.state);
    if (addr.postcode) addressParts.push(addr.postcode);
    
    return addressParts.length > 0 
      ? addressParts.join(', ')
      : data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

/**
 * Forward geocode: search address
 */
async function searchAddress(query) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=th&limit=5`,
      {
        headers: {
          'Accept-Language': 'th,en'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Search failed');
    }
    
    const data = await response.json();
    return data.map(item => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.display_name,
      type: item.type
    }));
    
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

/**
 * Move map to GPS location
 */
async function moveToCurrentLocation(map) {
  try {
    const location = await getCurrentLocation();
    
    // Move map to location
    map.setView([location.lat, location.lng], 16);
    
    // Remove old marker
    if (currentMarker) {
      map.removeLayer(currentMarker);
    }
    
    // Add marker
    currentMarker = L.marker([location.lat, location.lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(map);
    
    // Add accuracy circle
    L.circle([location.lat, location.lng], {
      radius: location.accuracy,
      color: '#4285F4',
      fillColor: '#4285F4',
      fillOpacity: 0.1
    }).addTo(map);
    
    // Get address
    const address = await reverseGeocode(location.lat, location.lng);
    
    // Store location
    selectedLocation = {
      lat: location.lat,
      lng: location.lng,
      address: address
    };
    
    // Show popup
    currentMarker.bindPopup(`
      <div style="min-width: 200px;">
        <strong>📍 ตำแหน่งปัจจุบัน</strong><br>
        <small>${address}</small><br>
        <small style="color: #666;">ความแม่นยำ: ±${Math.round(location.accuracy)}m</small><br><br>
        <button onclick="confirmLocation()" class="btn btn-primary btn-sm" style="width: 100%;">
          ✓ ใช้ตำแหน่งนี้
        </button>
      </div>
    `).openPopup();
    
    Toast.success('พบตำแหน่งของคุณแล้ว!');
    
    return location;
    
  } catch (error) {
    Toast.error(error.message);
    throw error;
  }
}

/**
 * Confirm selected location
 */
function confirmLocation() {
  if (!selectedLocation) {
    Toast.error('กรุณาเลือกตำแหน่งบนแผนที่');
    return;
  }
  
  // Fill address field if exists
  const addressField = document.getElementById('delivery_address');
  if (addressField) {
    addressField.value = selectedLocation.address;
  }
  
  // Store coordinates in hidden fields if they exist
  const latField = document.getElementById('delivery_lat');
  const lngField = document.getElementById('delivery_lng');
  if (latField) latField.value = selectedLocation.lat;
  if (lngField) lngField.value = selectedLocation.lng;
  
  Toast.success('เลือกตำแหน่งเรียบร้อยแล้ว');
  
  // Close modal if map is in modal
  Modal.closeAll();
}

/**
 * Show map in modal for location picking
 */
function openLocationPickerModal() {
  // Create modal if doesn't exist
  let modal = document.getElementById('locationPickerModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'locationPickerModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 900px; width: 90%;">
        <div class="modal-header">
          <h2>📍 เลือกตำแหน่งส่งของ</h2>
          <button class="close-btn" onclick="Modal.close('locationPickerModal')">&times;</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom: 1rem;">
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
              <input 
                type="text" 
                id="locationSearch" 
                placeholder="ค้นหาที่อยู่... (เช่น ถนนนิมมานเหมินท์, เชียงใหม่)"
                style="flex: 1;"
              >
              <button onclick="searchLocationOnMap()" class="btn btn-secondary">
                🔍 ค้นหา
              </button>
              <button onclick="moveToCurrentLocationWrapper()" class="btn btn-primary">
                📍 ตำแหน่งปัจจุบัน
              </button>
            </div>
            <p style="color: #666; font-size: 0.9rem; margin: 0;">
              💡 คลิกบนแผนที่เพื่อเลือกตำแหน่ง หรือกดปุ่ม "ตำแหน่งปัจจุบัน" เพื่อใช้ GPS
            </p>
          </div>
          <div id="orderMap" style="height: 500px; border-radius: 8px; border: 2px solid #e0e0e0;"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  // Open modal
  Modal.open('locationPickerModal');
  
  // Initialize map after modal is visible
  setTimeout(() => {
    if (!orderMap) {
      orderMap = initLocationPicker('orderMap');
    } else {
      orderMap.invalidateSize(); // Refresh map size
    }
  }, 100);
}

/**
 * Wrapper function for GPS button
 */
async function moveToCurrentLocationWrapper() {
  if (!orderMap) {
    Toast.error('แผนที่ยังไม่พร้อม');
    return;
  }
  
  try {
    await moveToCurrentLocation(orderMap);
  } catch (error) {
    // Error already handled in moveToCurrentLocation
  }
}

/**
 * Search location and move map
 */
async function searchLocationOnMap() {
  const searchInput = document.getElementById('locationSearch');
  const query = searchInput?.value?.trim();
  
  if (!query) {
    Toast.warning('กรุณาใส่ที่อยู่ที่ต้องการค้นหา');
    return;
  }
  
  if (!orderMap) {
    Toast.error('แผนที่ยังไม่พร้อม');
    return;
  }
  
  Loading.show();
  
  try {
    const results = await searchAddress(query);
    
    if (results.length === 0) {
      Toast.warning('ไม่พบผลลัพธ์ กรุณาลองค้นหาใหม่');
      return;
    }
    
    // Move to first result
    const location = results[0];
    orderMap.setView([location.lat, location.lng], 16);
    
    // Remove old marker
    if (currentMarker) {
      orderMap.removeLayer(currentMarker);
    }
    
    // Add marker
    currentMarker = L.marker([location.lat, location.lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(orderMap);
    
    selectedLocation = location;
    
    // Show popup with all results
    let popupContent = '<div style="min-width: 250px;"><strong>🔍 ผลการค้นหา</strong><br>';
    
    if (results.length > 1) {
      popupContent += '<small>พบ ' + results.length + ' ผลลัพธ์</small><br><br>';
      popupContent += '<select id="searchResults" style="width: 100%; margin-bottom: 0.5rem;">';
      results.forEach((r, i) => {
        popupContent += `<option value="${i}">${r.address}</option>`;
      });
      popupContent += '</select><br>';
    } else {
      popupContent += `<small>${location.address}</small><br><br>`;
    }
    
    popupContent += `
      <button onclick="confirmLocation()" class="btn btn-primary btn-sm" style="width: 100%;">
        ✓ ใช้ตำแหน่งนี้
      </button>
    </div>`;
    
    currentMarker.bindPopup(popupContent).openPopup();
    
    Toast.success(`พบ ${results.length} ผลลัพธ์`);
    
  } catch (error) {
    console.error('Search error:', error);
    Toast.error('เกิดข้อผิดพลาดในการค้นหา');
  } finally {
    Loading.hide();
  }
}

/**
 * Display order location on map (for viewing)
 */
function showOrderLocation(lat, lng, address, elementId) {
  const map = L.map(elementId).setView([lat, lng], 15);
  
  L.tileLayer(MAP_CONFIG.TILE_LAYER, {
    attribution: MAP_CONFIG.ATTRIBUTION,
    maxZoom: 19
  }).addTo(map);
  
  L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  }).addTo(map)
    .bindPopup(`<strong>📍 ตำแหน่งส่งของ</strong><br><small>${address}</small>`)
    .openPopup();
  
  return map;
}

/**
 * Get distance between two points (Haversine formula)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance; // in kilometers
}

/**
 * Format distance for display
 */
function formatDistance(km) {
  if (km < 1) {
    return `${Math.round(km * 1000)} ม.`;
  } else {
    return `${km.toFixed(1)} กม.`;
  }
}

// Export functions
window.initLocationPicker = initLocationPicker;
window.getCurrentLocation = getCurrentLocation;
window.reverseGeocode = reverseGeocode;
window.searchAddress = searchAddress;
window.moveToCurrentLocation = moveToCurrentLocation;
window.confirmLocation = confirmLocation;
window.openLocationPickerModal = openLocationPickerModal;
window.moveToCurrentLocationWrapper = moveToCurrentLocationWrapper;
window.searchLocationOnMap = searchLocationOnMap;
window.showOrderLocation = showOrderLocation;
window.calculateDistance = calculateDistance;
window.formatDistance = formatDistance;
window.selectedLocation = selectedLocation;
