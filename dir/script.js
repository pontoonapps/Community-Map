// authCode will be used to store the encoded email and password for the Basic HTTP Authorisation
// This is only to be used for localhost testing. CTRL+F 'credentials' to find the deployed versions

const PONTOONAPIKEY = '4F9694E1-3AB8-4992-8B3E-C5C6B26412CD';

let authCode, map, userType, markerInfo;
let pageInitialised = false;
let userMarkers = [];
changeLanguage();
function changeLanguage() {
  try {
    const controlsTC = [];
    const listLength = map.controls[google.maps.ControlPosition.TOP_CENTER].length;
    for (let i = 0; i < listLength; i++) {
      controlsTC.push(map.controls[google.maps.ControlPosition.TOP_CENTER].pop());
    }
    const revControlsTC = controlsTC.reverse();
    for (let i = 0; i < listLength; i++) {
      map.controls[google.maps.ControlPosition.TOP_CENTER].push(revControlsTC[i]);
    }
  } catch (e) {
    // If the page isn't initialised, then the issue is that map.controls doesn't exist due to the map not existing yet
    if (pageInitialised) {
      console.error(e);
    }
  }
  if (markerInfo) {
    markerInfo.close();
  }
  closeEditMenu();
  switch (userLanguage) {
    case 'EN':
      title.textContent = 'Community';
      root.style.setProperty('--frenchVisibility', 'none');
      root.style.setProperty('--englishVisibility', 'block');
      localStorage.setItem('PONTOON_CG_LANG', 'english');
      break;

    case 'FR':
      title.textContent = 'Communauté';
      root.style.setProperty('--englishVisibility', 'none');
      root.style.setProperty('--frenchVisibility', 'block');
      localStorage.setItem('PONTOON_CG_LANG', 'french');
      break;
  }
}

function getGuestDetails() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const guestTC = urlParams.get('tc');
  // Set authCode with information about the guest account
  if (guestTC) {
    authCode = btoa('guest_account' + ':' + guestTC);
  }
}

async function initPage() {
  // Get URL parameters to check if a user is a guest
  getGuestDetails();
  await userTypeCheck();
  interregForm();
  showMap();
  document.getElementById('setEnglish').addEventListener('click', () => {
    if (userLanguage === 'FR') {
      userLanguage = 'EN';
      changeLanguage();
      document.getElementById('setFrench').style.border = '';
      document.getElementById('setEnglish').style.border = '1px solid black';
    }
  });
  document.getElementById('setFrench').addEventListener('click', () => {
    if (userLanguage === 'EN') {
      userLanguage = 'FR';
      changeLanguage();
      document.getElementById('setEnglish').style.border = '';
      document.getElementById('setFrench').style.border = '1px solid black';
    }
  });
  pageInitialised = true;
}

// function to initialise map on form adapted from https://developers.google.com/maps/documentation/javascript/adding-a-google-map#maps_add_map-javascript
function showMap() {
  // initialise map on webpage
  map = new google.maps.Map(document.getElementById('map'), {
    mapTypeControlOptions: {
      mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain', 'styled_map'],
      style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
    },
    gestureHandling: 'greedy',
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_TOP,
    },
    scaleControl: true,
    streetViewControl: true,
    streetViewControlOptions: {
      position: google.maps.ControlPosition.RIGHT_TOP,
    },
  });
  // When the map is moved, close the info window, if one exists
  map.addListener('drag', () => {
    if (markerInfo) {
      markerInfo.close();
    }
    closeEditMenu();
  });

  // ---- PONToonApps Job Map style ----
  // Create a new StyledMapType object, passing it an array of styles,
  // and the name to be displayed on the map type control.
  // Styles taken from https://snazzymaps.com/style/61/blue-essence
  const styledMapType = new google.maps.StyledMapType(
    [
      {
        featureType: 'landscape.natural',
        elementType: 'geometry.fill',
        stylers: [
          {
            visibility: 'on',
          },
          {
            color: '#e0efef',
          },
        ],
      },
      {
        featureType: 'poi',
        elementType: 'geometry.fill',
        stylers: [
          {
            visibility: 'on',
          },
          {
            hue: '#1900ff',
          },
          {
            color: '#c0e8e8',
          },
        ],
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [
          {
            lightness: 100,
          },
          {
            visibility: 'simplified',
          },
        ],
      },
      {
        featureType: 'road',
        elementType: 'labels',
        stylers: [
          {
            visibility: 'on',
          },
        ],
      },
      {
        featureType: 'transit.line',
        elementType: 'geometry',
        stylers: [
          {
            visibility: 'on',
          },
          {
            lightness: 700,
          },
        ],
      },
      {
        featureType: 'water',
        elementType: 'all',
        stylers: [
          {
            color: '#7dcdcd',
          },
        ],
      },
    ],
    { name: 'Community Map' });
  // Associate the styled map with the MapTypeId and set it to display.
  map.mapTypes.set('styled_map', styledMapType);
  map.setMapTypeId('styled_map');
  // -----------------------------------

  // Portsmouth will be the default centre of the map if geolocation fails
  const portsmouth = { lat: 50.794851, lng: -1.090886 };

  // If the app can use geolocation, then centre map on user and create geolocation button, otherwise centre on 'centre of the world'
  // Want to try and make this faster. Currently there's lag when the page is first loaded
  canGeolocate()
    .then((position) => {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      moveMapTo(pos);
      // Add button to pan to current location
      const locationButton = document.createElement('button');
      locationButton.id = 'geolocationControlButton';
      // Insert the my_location google icon
      locationButton.innerHTML = '<i class="material-icons">my_location</i>';
      locationButton.classList.add('custom-map-control-button', 'custom-map-control-icon');
      map.controls[google.maps.ControlPosition.RIGHT_TOP].push(locationButton);
      locationButton.addEventListener('click', () => { centreMapOnUser(); });
    })
    .catch(() => {
      moveMapTo(portsmouth);
    });

  if (userType !== 'guest') {
    // Drag and drop marker button
    const createMarker = document.createElement('button');
    createMarker.id = 'markerCreatorButton';
    createMarker.draggable = true;
    createMarker.innerHTML = '<img src="https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2.png">';
    createMarker.classList.add('custom-map-control-button', 'custom-map-control-icon', 'has-tooltip');
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(createMarker);
    createMarker.addEventListener('click', () => { createNewMarker(); });

    const createMarkerTooltip = document.createElement('span');
    createMarkerTooltip.id = 'createMarkerTooltip';
    createMarkerTooltip.classList.add('tooltip');
    createMarkerTooltip.innerHTML = '<span class="english-text">Add pin</span><span class="french-text">Ajouter une épingle</span>';
    createMarker.appendChild(createMarkerTooltip);
  }

  // Add event for Interreg Button
  document.getElementById('interregButton').addEventListener('click', () => {
    document.getElementById('interregWindow').style.display = 'block';
  });

  loadMarkers();

  // call functions to load page elements based on userType
  if (userType === 'recruiter') {
    loadPageForRecruiter(map);
  } else if (userType === 'user') {
    loadPageForUser(map);
  } else if (userType === 'guest') {
    loadPageForGuest(map);
  }
}

function loadPageForGuest() {
  categoryDropdown();
}

// Handle event for marker creation
function createNewMarker(pos = null) {
  if (!pos) { pos = map.getCenter(); }
  const newMarker = new google.maps.Marker({
    position: pos,
    draggable: true,
    title: 'New Marker',
    map: map,
    userPin: true,
    category: 1,
  });
  const newIcon = MARKER_ICON;
  newIcon.fillColor = categoryToColour(newMarker.category);
  newMarker.setIcon(MARKER_ICON);
  userMarkers.push(newMarker);
  // Instantly put the marker in the database
  markerDropped(newMarker)
    .then(response => {
      // We need to manually set the id due to this marker not being retrieved from the database originally
      newMarker.id = response.id;
      newMarker.addListener('dragend', () => { markerDropped(newMarker); });
      newMarker.addListener('click', () => { markerSelected(newMarker); });
    });
  markerSelected(newMarker);
}

// Click event for the marker creation button
async function markerDropped(marker) {
  if (marker.title) {
    const pinForm = markerToPin(marker);
    const response = await addUserPin(pinForm);
    return response;
  }
}

// #### USER & RECRUITER ROUTES ####
// function to handle passing login information
async function userTypeCheck() {
  const requestData = {
    method: 'GET',
  };
  // If authCode is true, then the user is a guest and has no cookie credentials
  if (authCode) {
    requestData.headers = { Authorization: 'Basic ' + authCode };
  } else {
    requestData.credentials = 'include';
  }
  const res = await fetch(`/community-api/v2/login?apiKey=${PONTOONAPIKEY}`, requestData);
  if (res.ok) {
    const resData = await res.json();
    userType = resData.role;
  }
}

// Send Fetch request to API and get user pins
async function getUserPins() {
  const requestData = {
    method: 'GET',
  };
  // If authCode is true, then the user is a guest and has no cookie credentials
  if (authCode) {
    requestData.headers = { Authorization: 'Basic ' + authCode };
  } else {
    requestData.credentials = 'include';
  }
  const response = await fetch(`/community-api/v2/pins?apiKey=${PONTOONAPIKEY}`, requestData);
  if (!response.ok) throw response;
  const resData = await response.json();
  return resData;
}

// Send fetch request to API and add user pin
async function addUserPin(data) {
  const response = await fetch(`/community-api/v2/pins?apiKey=${PONTOONAPIKEY}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      // 'Authorization': 'Basic ' + authCode,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw response;
  const resData = await response.json();
  return resData;
}

// Delete pin given it's id
async function deletePinById(pinId) {
  const data = { id: pinId };
  const response = await fetch(`/community-api/v2/pins/delete?apiKey=${PONTOONAPIKEY}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      // 'Authorization': 'Basic ' + authCode,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw response;
}

// #### USER ONLY ROUTES ####
// Returns all training centres user is subscribed to
async function getTrainingCentres() {
  if (userType !== 'user') {
    console.log('User is wrong type. User = ', userType);
    return [];
  }
  const response = await fetch(`/community-api/v2/user/training-centres?apiKey=${PONTOONAPIKEY}`, {
    method: 'GET',
    credentials: 'include',
    // headers: {
    //   Authorization: 'Basic ' + authCode,
    // },
  });
  if (!response.ok) throw response;
  const resData = await response.json();
  return resData;
}

// Remove user from training centre given the centre email
async function unsubscribeFrom(centreEmail) {
  if (userType !== 'user') {
    console.log('User is wrong type. User = ', userType);
    return false;
  }
  const data = { email: centreEmail };
  const response = await fetch(`/community-api/v2/user/training-centres/remove?apiKey=${PONTOONAPIKEY}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      // 'Authorization': 'Basic ' + authCode,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw response;
}


// #### RECRUITER ONLY ROUTES ####
// Send fetch request to API to add user to current training centre

async function doesCentreHaveGuestAccount() {
  if (userType !== 'recruiter') {
    console.log('User is wrong type. User = ', userType);
    return false;
  }
  const response = await fetch(`/community-api/v2/training-centre/guest-account?apiKey=${PONTOONAPIKEY}`, {
    method: 'GET',
    credentials: 'include',
    // headers: {
    //   Authorization: 'Basic ' + authCode,
    // },
  });
  if (!response.ok) throw response;
  const resData = await response.json();
  return resData;
}

async function setCentreGuestAccount(newValue) {
  if (userType !== 'recruiter') {
    console.log('User is wrong type. User = ', userType);
    return false;
  }

  const data = { has_guest_account: newValue };
  const response = await fetch(`/community-api/v2/training-centre/guest-account?apiKey=${PONTOONAPIKEY}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      // 'Authorization': 'Basic ' + authCode,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw response;
}

async function getSubscribedUsers() {
  if (userType !== 'recruiter') {
    console.log('User is wrong type. User = ', userType);
    return false;
  }
  const response = await fetch(`/community-api/v2/training-centre/users?apiKey=${PONTOONAPIKEY}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      // 'Authorization': 'Basic ' + authCode,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw response;
  const resData = await response.json();
  return resData;
}

async function addUsersToCentre(listOfEmails) {
  if (userType !== 'recruiter') {
    console.log('User is wrong type. User = ', userType);
    return false;
  }
  const data = { add: listOfEmails };
  const response = await fetch(`/community-api/v2/training-centre/users?apiKey=${PONTOONAPIKEY}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      // 'Authorization': 'Basic ' + authCode,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw response;
  const resData = await response.json();
  return resData;
}

// Send fetch request to API to remove user from current training centre
async function removeUsersFromCentre(listOfEmails) {
  if (userType !== 'recruiter') {
    console.log('User is wrong type. User = ', userType);
    return false;
  }
  const data = { remove: listOfEmails };
  const response = await fetch(`/community-api/v2/training-centre/users?apiKey=${PONTOONAPIKEY}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      // 'Authorization': 'Basic ' + authCode,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw response;
  // const resData = await response.json();
  // return response;
}

function validateEmail(mail) {
  return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(mail);
}

// Handler function for subscribing users
async function addEmail() {
  const emailToAdd = document.getElementById('newEmailField').value;

  const response = await addUsersToCentre([emailToAdd]);

  if (response.length === document.getElementById('emailListContainer').childNodes.length) {
    switch (userLanguage) {
      case 'EN':
        alert('Add User Failed');
        break;
      case 'FR':
        alert("L'ajout d'un utilisateur a échoué");
        break;
    }
  }

  document.getElementById('newEmailField').value = '';

  const listContainer = document.getElementById('emailListContainer');
  // Populate list again
  const subscribedUsers = await getSubscribedUsers();
  subscribedUsers.sort();
  listContainer.innerHTML = '';
  subscribedUsers.forEach(email => {
    const newItem = document.createElement('div');
    newItem.classList.add('dropdown-item', 'user-email');
    listContainer.appendChild(newItem);

    const newCheckbox = document.createElement('input');
    newCheckbox.setAttribute('type', 'checkbox');
    newCheckbox.style.cursor = 'pointer';
    newCheckbox.name = email;
    newCheckbox.value = email;
    newItem.appendChild(newCheckbox);

    const newLabel = document.createElement('label');
    newLabel.classList.add('filter-list-label');
    newLabel.style.cursor = 'pointer';
    newLabel.for = newCheckbox.name;
    newLabel.textContent = email;
    newItem.appendChild(newLabel);

    newItem.addEventListener('click', (e) => { dropdownClickHandler(e); });
  });
}

// Handler function for unsubscribing users
async function removeEmails() {
  const emailList = [];
  const emailFields = document.querySelectorAll('.user-email');
  emailFields.forEach(entry => {
    if (entry.childNodes[0].checked) {
      emailList.push(entry.childNodes[0].value);
      entry.remove();
    }
  });
  await removeUsersFromCentre(emailList);
}

// Function to load Interreg info splash screen. Will display on page load and button event
function interregForm() {
  // Set content
  let content = '<img src="./img/Interreg Logo.png"></img>';
  // If user is logged in, display login buttons
  if (!userType) {
    content += '<h3><span class="english-text">Please note:</span><span class="french-text">Précisions:</span></h3>';
    content += '<p><span class="english-text">You must be logged in to use Community Map.</span><span class="french-text">Vous devez être connecté pour utiliser Communauté</span></p>'; // NEED TRANSLATION
    content += '<p><span class="english-text">If you already have a PONToonapps account, click Sign in to proceed with your existing account. If you do not already have an account, create one with the Sign Up button.</span><span class="french-text">Si vous avez déjà un compte PONToonapps, cliquez sur Se connecter pour continuer avec votre compte existant. Si vous n\'avez pas encore de compte, créez-en un avec le bouton S\'inscrire ou cliquez sur Se connecter en tant qu\'invité pour ouvrir un compte d\'invité.</span></p>';
    content += '<div id=\'loginButtons\'><button id="signIn"><span class="english-text">Sign In</span><span class="french-text">Connexion</span></button><button id="signUp"><span class="english-text">Sign Up</span><span class="french-text">S\'inscrire</span></button><br>'; // NEED TRANSLATION "Sign Up"
    document.getElementById('interregWindowClose').style.display = 'none';
  }
  content += '<p><span class="english-text">Project PONToon, Partnership Opportunities using New Technologies fostering sOcial and ecOnomic inclusiON 2017-2021,  is a 5.8 million euro digital upskilling collaboration between participants in Southern England and Northern France. The project is 69% funded by the European Regional Development Fund, Interreg France (Channel) England programme and is delivered by 11 partners: The University of Portsmouth (lead), Amiens Metropole, Aspex, ADICE, Digital Peninsula Network, Devon Mind, Eastleigh Borough Council, GIP-FCIP de l’academie de Caen, MEFP, TRAJECTIO and WSX Enterprise.</span><span class="french-text">Le projet PONToon, partenariat utilisant les nouvelles technologies en faveur de l\'inclusion sociale et économique entre 2017 et 2021, est une action de formation numérique entre des participants du sud de l\'Angleterre et du nord de la France, d\'un montant de 5,8 millions d\'euros. Le projet est financé à 69% par le Fonds européen de développement régional, le programme Interreg France (Manche) Angleterre et est mis en œuvre par 11 partenaires, l\'Université de Portsmouth (chef de file), Amiens Métropole, Aspex, ADICE, Digital Peninsula Network, Devon Mind, Eastleigh Borough Council, GIP-FCIP de l\'académie de Caen, MEFP, TRAJECTIO et WSX Enterprise.<br><br>Pour plus d\'informations, veuillez <a href=https://pontoonproject.eu/>cliquer ici</a>.<br><br></span></p>';
  content += '<img src="./img/PartnerLogoBanner_Jun20.png"></img>';
  document.getElementById('interregContent').insertAdjacentHTML('beforeend', content);

  // Show for load
  document.getElementById('interregWindow').style.display = 'block';

  // If 'x' is clicked, hide
  if (userType) {
    document.getElementById('interregWindowClose').addEventListener('click', () => {
      document.getElementById('interregWindow').style.display = 'none';
    });
  } else {
    document.getElementById('signIn').addEventListener('click', () => {
      window.location.href = '/login.php';
    });
    document.getElementById('signUp').addEventListener('click', () => {
      window.location.href = '/signup.php';
    });
  }
}

// Load key page elements for a recruiter
async function loadPageForRecruiter() {
  categoryDropdown();

  // Sets up and appends a custom control, used to add users to a Training Centre
  const clickBox = document.createElement('div');
  clickBox.classList.add('dropdown-container');
  clickBox.id = 'centre-dropdown';
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(clickBox);
  const clickBoxText = document.createElement('button');
  clickBoxText.innerHTML = '<span class="english-text">Users Registered</span><span class="french-text">Utilisateurs inscrits à vos côtés</span>';
  clickBoxText.classList.add('custom-map-control-button', 'dropdown-button');
  clickBox.appendChild(clickBoxText);

  let isGuestAccountActive = await doesCentreHaveGuestAccount();
  // Create window
  // Mouseover event listener
  clickBoxText.addEventListener('click', async () => {
    if (document.getElementById('emailWindow')) {
      document.getElementById('emailWindow').remove();
      return;
    }

    const emailWindow = document.createElement('div');
    emailWindow.id = 'emailWindow';
    emailWindow.style.display = 'block';
    document.getElementById('bodyContainer').appendChild(emailWindow);

    const emailHTML = '<h3><span class="english-text">Users registered with you:</span><span class="french-text">Utilisateurs inscrits à vos côtés:</span></h3>';

    emailWindow.insertAdjacentHTML('beforeend', emailHTML);

    const emailCloseButton = document.createElement('span');
    emailCloseButton.classList.add('closeButton');
    emailCloseButton.textContent = '✖';
    emailWindow.appendChild(emailCloseButton);

    emailCloseButton.addEventListener('click', () => {
      emailWindow.remove();
    });

    const listContainer = document.createElement('div');
    listContainer.id = 'emailListContainer';
    listContainer.classList.add('scrollable-container');
    emailWindow.appendChild(listContainer);

    const removeEmailsButton = document.createElement('button');
    removeEmailsButton.id = 'removeEmailsButton';
    removeEmailsButton.innerHTML = '<span class="english-text">Remove</span><span class="french-text">Supprimer</span>';
    emailWindow.appendChild(removeEmailsButton);

    emailWindow.insertAdjacentHTML('beforeend', '<hr>');


    const newEmailField = document.createElement('input');
    newEmailField.id = 'newEmailField';
    newEmailField.placeholder = 'Email...';
    emailWindow.appendChild(newEmailField);

    const addEmailsButton = document.createElement('button');
    addEmailsButton.id = 'addEmailsButton';
    addEmailsButton.innerHTML = '<span class="english-text">Add User</span><span class="french-text">Ajouter un utilisateur</span>';
    emailWindow.appendChild(addEmailsButton);

    const uploadCSVButton = document.createElement('button');
    uploadCSVButton.id = 'uploadCSVButton';
    uploadCSVButton.innerHTML = '<input id="fileInput" type="file" accept=".csv" hidden/><span class="english-text">Upload .csv file</span><span class="french-text">Télécharger un fichier .csv</span>';
    uploadCSVButton.addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });
    emailWindow.appendChild(uploadCSVButton);

    const downloadCSVButton = document.createElement('a');
    downloadCSVButton.id = 'downloadCSVButton';
    downloadCSVButton.href = `${window.location.href}docs/PONToon Email Upload CSV Example.csv`;
    downloadCSVButton.innerHTML = '<span class="english-text">Click here to download an example .csv file</span><span class="french-text">Cliquez ici pour télécharger un exemple de fichier .csv</span>';
    emailWindow.appendChild(downloadCSVButton);

    const toggleGuestContainer = document.createElement('div');
    toggleGuestContainer.id = 'toggleGuestContainer';
    toggleGuestContainer.innerHTML = '<h3><span class="english-text">Guest Account</span><span class="french-text">Compte d\'invité</span></h3>';
    emailWindow.appendChild(toggleGuestContainer);

    const toggleGuestSwitch = document.createElement('div');
    toggleGuestSwitch.id = 'toggleSwitchContainer';
    let htmlContent = '<p><span class="english-text">Enable guest account to create a link to share with users without pontoonapps.com accounts.</span><span class="french-text">Activer le compte d\'invité pour créer un lien à partager avec les utilisateurs sans compte pontoonapps.com.</span></p>';
    htmlContent += '<label class="switch"><input id="guestSwitch" class="switch-input" type="checkbox"><span class="slider round"></span></label>';
    toggleGuestSwitch.innerHTML = htmlContent;
    toggleGuestContainer.appendChild(toggleGuestSwitch);

    const guestLinkContainer = document.createElement('div');
    guestLinkContainer.id = 'guestLinkContainer';
    guestLinkContainer.innerHTML = `<p>URL for guests to use:</p><p>${window.location.href}?tc=YOUR_EMAIL</p><p>Replace "YOUR_EMAIL" with the email this account is set up under`;
    toggleGuestContainer.appendChild(guestLinkContainer);

    // Set Guest Toggle
    const guestSwitch = document.getElementById('guestSwitch');
    guestSwitch.checked = isGuestAccountActive;

    guestSwitch.addEventListener('change', async () => {
      await setCentreGuestAccount(guestSwitch.checked);
      isGuestAccountActive = guestSwitch.checked;
    });

    // Populate list of subscribed users
    const subscribedUsers = await getSubscribedUsers();
    subscribedUsers.sort();
    listContainer.innerHTML = '';
    subscribedUsers.forEach(email => {
      const newItem = document.createElement('div');
      newItem.classList.add('dropdown-item', 'user-email');
      listContainer.appendChild(newItem);

      const newCheckbox = document.createElement('input');
      newCheckbox.setAttribute('type', 'checkbox');
      newCheckbox.style.cursor = 'pointer';
      newCheckbox.name = email;
      newCheckbox.value = email;
      newItem.appendChild(newCheckbox);

      const newLabel = document.createElement('label');
      newLabel.classList.add('filter-list-label');
      newLabel.style.cursor = 'pointer';
      newLabel.for = newCheckbox.name;
      newLabel.textContent = email;
      newItem.appendChild(newLabel);

      newItem.addEventListener('click', (e) => { dropdownClickHandler(e); });
    });

    document.getElementById('removeEmailsButton').addEventListener('click', () => {
      removeEmails();
    });

    document.getElementById('addEmailsButton').addEventListener('click', () => {
      addEmail();
    });

    // Click event handler for CSV submit button
    const input = document.getElementById('fileInput');
    input.addEventListener('change', () => {
      csvUpload(input);
    });
  });
}

// Grab uploaded file data, manipulate and check it for uploading to server
async function csvUpload(input) {
  // Array of valid .csv file types (i had no idea there was like 4 of them)
  const validType = ['.csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  // checks number of files uploaded; in place until we decide the worth of implementing multi-file upload
  // then checks validity
  if (input.files.length === 0) {
    window.alert('No files selected.');
    document.getElementById('emailWindow').remove();
    return;
  } else if (input.files.length > 1) {
    window.alert('Upload one file at a time please.');
    document.getElementById('emailWindow').remove();
    return;
  } else if (!validType.includes(input.files[0].type)) {
    window.alert('Upload valid .csv files only please. Your file type was: ' + input.files[0].type);
    document.getElementById('emailWindow').remove();
    return;
  }
  // Once checks passed, process file. Uses FileReader and streams it like a blob object
  const uploadFile = input.files[0];
  // const reader = new FileReader();
  const stream = uploadFile.text()
    .then(async stream => {
      // Splits file at comma values and remove trailing/leading double quotes that are apparent for literally no reason
      // Remove any quotes in the csv
      const emails1 = stream.replaceAll('"', '');

      // Remove any new lines in csv
      const emails2 = emails1.replace(/\r?\n|\r/g, '');

      // Split string into list of emails
      const splitArray = emails2.split(',');

      // Validate emails
      const validEmails = [];
      splitArray.forEach(item => {
        if (validateEmail(splitArray[item]) === true) {
          validEmails.push(splitArray[item]);
        }
      });

      // Send to server; check response length for addition success
      const count = await getSubscribedUsers();
      const response = await addUsersToCentre(validEmails);
      if ((response.length - count.length) === validEmails.length) {
        window.alert('Users successfully subscribed.');
      } else {
        window.alert('Issue when subscribing; not all emails have been added. Re-open menu and validate.');
      }
      document.getElementById('emailWindow').remove();
    });
}

// Load key page elements for user/jobseeker
async function loadPageForUser() {
  // Filter list to select what training centres to view
  // I feel sorry for anyone who has to read this

  // Removes if existing (used for refresh purposes)
  if (document.getElementById('centreFilterContainer')) {
    document.getElementById('centreFilterContainer').remove();
  }

  // Create the container for the training centre dropdown menu
  const centreFilterContainer = document.createElement('div');
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(centreFilterContainer);
  centreFilterContainer.id = 'centreFilterContainer';
  centreFilterContainer.classList.add('dropdown-container');

  // This button is what will be displayed at all times on screen
  const centreFilterButton = document.createElement('button');
  centreFilterButton.id = 'centreFilterButton';
  centreFilterButton.classList.add('custom-map-control-button', 'dropdown-button');
  centreFilterButton.innerHTML = '<span class="english-text">Filter by Service</span><span class="french-text">Filtrer par service</span>';
  centreFilterContainer.appendChild(centreFilterButton);
  // This container will hold all the items in the dropdown menu
  const centreFilterList = document.createElement('div');
  centreFilterList.classList.add('dropdown-content', 'hidden');
  centreFilterList.id = 'centreDropdown';
  centreFilterContainer.appendChild(centreFilterList);

  // Get all the training centres the user has access to
  const trainingCentres = await getTrainingCentres();
  trainingCentres.forEach(centre => {
    // This container will hold the contents of each item in the dropdown menu
    const newContainer = document.createElement('div');
    newContainer.classList.add('dropdown-item', 'centre-item');
    centreFilterList.appendChild(newContainer);

    // This will be the checkbox element that will indicate what the user wants to filter
    const newItem = document.createElement('input');
    newItem.style.cursor = 'pointer';
    newItem.checked = true;
    newItem.setAttribute('type', 'checkbox');
    newItem.value = centre.email;
    newItem.name = centre.email;
    newContainer.appendChild(newItem);

    // This label will display the training centre names
    const newLabel = document.createElement('label');
    newLabel.classList.add('filter-list-label');
    newLabel.style.cursor = 'pointer';
    newLabel.for = newItem.name;
    newLabel.textContent = `${centre.name.first} ${centre.name.last}`;
    newContainer.appendChild(newLabel);

    // When any part of the list item is clicked, we want to call the handler
    newContainer.addEventListener('click', (e) => {
      dropdownClickHandler(e);
      checkboxChanged();
    });
  });

  centreFilterButton.addEventListener('touchstart', () => {
    if (centreFilterList.classList.contains('hidden')) {
      centreFilterList.classList.remove('hidden');
    } else {
      centreFilterList.classList.add('hidden');
    }
  });

  centreFilterContainer.addEventListener('mouseenter', () => {
    centreFilterList.classList.remove('hidden');
  });

  centreFilterContainer.addEventListener('mouseleave', () => {
    centreFilterList.classList.add('hidden');
  });

  // Draws the Filter by Category dropdown
  categoryDropdown();

  // Draws the Unsubscribe From box. Found it easier to put in own function
  userUnsubDropdown();
}

function categoryDropdown() {
  // Removes if existing (used for refresh purposes)
  if (document.getElementById('categoryFilterContainer')) {
    document.getElementById('categoryFilterContainer').remove();
  }

  // Create the container for the categories dropdown menu
  const categoryFilterContainer = document.createElement('div');
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(categoryFilterContainer);
  categoryFilterContainer.id = 'categoryFilterContainer';
  categoryFilterContainer.classList.add('dropdown-container');

  // This button is what will be displayed at all times on screen
  const categoryFilterButton = document.createElement('button');
  categoryFilterButton.id = 'categoryFilterButton';
  categoryFilterButton.classList.add('custom-map-control-button', 'dropdown-button');
  categoryFilterButton.innerHTML = '<span class="english-text">Filter by Category</span><span class="french-text">Catégories</span>';
  categoryFilterContainer.appendChild(categoryFilterButton);

  // This container will hold all the items in the dropdown menu
  const categoryFilterList = document.createElement('div');
  categoryFilterList.classList.add('dropdown-content', 'hidden');
  categoryFilterList.id = 'categoryDropdown';
  categoryFilterContainer.appendChild(categoryFilterList);

  CATEGORIES.forEach(category => {
    // This container will hold the contents of each item in the dropdown menu
    const newContainer = document.createElement('div');
    newContainer.classList.add('dropdown-item', 'category-item');
    newContainer.style.display = 'flex';
    categoryFilterList.appendChild(newContainer);
    // This will be the checkbox element that will indicate what the user wants to filter
    const newItem = document.createElement('input');
    newItem.style.cursor = 'pointer';
    newItem.checked = true;
    newItem.setAttribute('type', 'checkbox');
    newItem.name = category.englishTitle;
    newContainer.appendChild(newItem);
    // This label will display the category names
    const newLabel = document.createElement('label');
    newLabel.classList.add('filter-list-label');
    newLabel.style.cursor = 'pointer';
    newLabel.for = newItem.name;
    newLabel.innerHTML = `<span class="english-text">${category.englishTitle}</span><span class="french-text">${category.frenchTitle}</span>`;
    newContainer.appendChild(newLabel);
    // When any part of the list item is clicked, we want to call the handler
    newContainer.addEventListener('click', (e) => {
      dropdownClickHandler(e);
      checkboxChanged();
    });
  });


  categoryFilterButton.addEventListener('touchstart', () => {
    if (categoryFilterList.classList.contains('hidden')) {
      categoryFilterList.classList.remove('hidden');
    } else {
      categoryFilterList.classList.add('hidden');
    }
  });

  categoryFilterContainer.addEventListener('mouseenter', () => {
    categoryFilterList.classList.remove('hidden');
  });

  categoryFilterContainer.addEventListener('mouseleave', () => {
    categoryFilterList.classList.add('hidden');
  });
}


async function userUnsubDropdown() {
  // Code shamelessly stolen until I find a way to make the list work noice
  // Remove if existing
  if (document.getElementById('centreUnsubContainer')) {
    document.getElementById('centreUnsubContainer').remove();
  }

  // Create the container for the unsubscribe button
  const centreUnsubContainer = document.createElement('div');
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(centreUnsubContainer);
  centreUnsubContainer.id = 'centreUnsubContainer';
  centreUnsubContainer.classList.add('dropdown-container');

  // This button is what will be displayed at all times on screen
  const centreUnsubButton = document.createElement('button');
  centreUnsubButton.id = 'centreUnsubButton';
  centreUnsubButton.classList.add('custom-map-control-button', 'dropdown-button');
  centreUnsubButton.innerHTML = '<span class="english-text">Unsubscribe from Service</span><span class="french-text">Se désabonner du service</span>';
  centreUnsubContainer.appendChild(centreUnsubButton);

  // This container will hold all the items in the dropdown menu
  const centreUnsubList = document.createElement('div');
  centreUnsubList.classList.add('dropdown-content', 'hidden');
  centreUnsubList.id = 'unsubDropdown';
  centreUnsubContainer.appendChild(centreUnsubList);

  // Gets training centres. Would reuse from loadPageForUser but will be different depending on unsubscriptions
  const trainingCentres = await getTrainingCentres();
  trainingCentres.forEach(centre => {
    // This container will hold the contents of each item in the dropdown menu
    const newContainer = document.createElement('div');
    newContainer.classList.add('dropdown-item', 'centre-item');
    centreUnsubList.appendChild(newContainer);

    // This label will display the training centre name
    const newLabel = document.createElement('label');
    newLabel.classList.add('filter-list-label');
    newLabel.style.cursor = 'pointer';
    newLabel.textContent = `${centre.name.first} ${centre.name.last}`;
    newContainer.appendChild(newLabel);

    // Separate click event due to no checkbox
    newContainer.addEventListener('click', async () => {
      if (confirm(`Unsubscribe from ${centre.name.first} ${centre.name.last}?`)) {
        await unsubscribeFrom(centre.email);
        userUnsubDropdown();
        loadPageForUser();
        loadMarkers();
      }
    });
  });

  centreUnsubButton.addEventListener('touchstart', () => {
    if (centreUnsubList.classList.contains('hidden')) {
      centreUnsubList.classList.remove('hidden');
    } else {
      centreUnsubList.classList.add('hidden');
    }
  });

  centreUnsubContainer.addEventListener('mouseenter', () => {
    centreUnsubList.classList.remove('hidden');
  });

  centreUnsubContainer.addEventListener('mouseleave', () => {
    centreUnsubList.classList.add('hidden');
  });
}

// When any part of the box is clicked, update the input element
function dropdownClickHandler(e) {
  let target;

  // Selecting by tagName to avoid conflicts between spans and centre names
  if (e.target.tagName === 'LABEL') {
    target = e.target.parentNode;
  } else if (e.target.tagName === 'SPAN') {
    target = e.target.parentNode.parentNode;
  } else {
    target = e.target;
  }
  const checkbox = target.childNodes[0];
  // If the checkbox itself was clicked, not having this if statement would essentially call this event twice
  if (e.toElement.type !== 'checkbox') {
    if (checkbox.checked) {
      checkbox.checked = false;
    } else {
      checkbox.checked = true;
    }
  }
}

// This function will have the logic behind filtering results
function checkboxChanged() {
  const filterCentres = [];
  const filterCategories = [];

  const centreList = document.getElementById('centreDropdown');
  if (centreList) {
    centreList.childNodes.forEach(item => {
      const checkbox = item.childNodes[0];
      if (!checkbox.checked) {
        filterCentres.push(checkbox.value);
      }
    });
  }

  const categoryList = document.getElementById('categoryDropdown');
  if (categoryList) {
    categoryList.childNodes.forEach(item => {
      const checkbox = item.childNodes[0];
      if (!checkbox.checked) {
      // Can't store none string values in HTML element. So will search array for a match to get actual value
        for (let i = 0; i < CATEGORIES.length; i++) {
          if (CATEGORIES[i].englishTitle === checkbox.name) {
            filterCategories.push(CATEGORIES[i].value);
            break;
          }
        }
      }
    });
  }

  const excluding = {
    centres: filterCentres,
    categories: filterCategories,
  };
  renderMarkers(excluding);
}

// Move the map so that the user's current location is in the centre of the screen
function centreMapOnUser() {
  // enableHighAccuracy apparently makes getCurrentPosition considerably faster
  const geolocationOptions = {
    timeout: Infinity,
    maximumAge: 0,
    enableHighAccuracy: true,
  };
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      moveMapTo(pos);
    },
    () => {},
    geolocationOptions,
  );
}

// Convert a pin from the PONtoon API into a marker ready for Google API
function pinToMarker(pinObj) {
  pinObj.title = pinObj.name;
  delete pinObj.name;
  pinObj.position = {
    lat: pinObj.latitude,
    lng: pinObj.longitude,
  };
  delete pinObj.latitude;
  delete pinObj.longitude;
  pinObj.map = map;

  // If the user submit the pin, then they should be able to move it around the map
  pinObj.draggable = pinObj.userPin;

  return pinObj;
}

// Convert a marker from the Google API into a pin ready for the PONtoon API
function markerToPin(markerObj) {
  const pinObj = {};
  pinObj.id = markerObj.id;
  pinObj.name = markerObj.title;
  const pos = markerObj.getPosition();
  pinObj.latitude = pos.lat();
  pinObj.longitude = pos.lng();
  pinObj.category = markerObj.category;
  pinObj.description = markerObj.description;
  pinObj.phone = markerObj.phone;
  pinObj.website = markerObj.website;
  pinObj.email = markerObj.email;
  pinObj.address_line_1 = markerObj.address_line_1;
  pinObj.address_line_2 = markerObj.address_line_2;
  pinObj.postcode = markerObj.postcode;
  pinObj.notes = markerObj.notes;
  return pinObj;
}

// Attempts to get users geolocation
function canGeolocate() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

// Change map centre to passed in position in form {lat: x, lng: y}
function moveMapTo(position, zoom = 13) {
  map.setCenter(position);
  map.setZoom(zoom);
}

// Removes markers from screen
function removeAllMarkers() {
  userMarkers.forEach(marker => {
    marker.setMap(null);
  });
  userMarkers = [];
}

// Will load markers from the database and adds correct listeners
async function loadMarkers() {
  // Clear the current list of markers
  removeAllMarkers();

  // Get list of user pins, handle pin information before drawing
  const pinList = await getUserPins();
  pinList.forEach(pin => {
    const markerForm = pinToMarker(pin);
    const newMarker = new google.maps.Marker(markerForm);
    const newIcon = MARKER_ICON;
    newIcon.fillColor = categoryToColour(newMarker.category);
    newMarker.setIcon(MARKER_ICON);
    userMarkers.push(newMarker);
    newMarker.addListener('click', () => { markerSelected(newMarker); });
    newMarker.addListener('dragend', () => { markerDropped(newMarker); });
  });
  // Draw pins
  renderMarkers();
}

// Will render markers onto the screen, excluding any training centres or categories supplied
function renderMarkers(excluding) {
  // Closing the info window here saves a lot of hassle down the line
  if (markerInfo) {
    markerInfo.close();
  }
  if (excluding) {
    userMarkers.forEach(marker => {
      if (excluding.centres.includes(marker.training_centre_email)) {
        marker.setMap(null);
      } else {
        marker.setMap(map);
        if (excluding.categories.includes(marker.category)) {
          marker.setMap(null);
        } else {
          marker.setMap(map);
        }
      }
    });
  }
}

function categoryToName(num) {
  if (userLanguage == 'EN') {
    return CATEGORIES[num - 1].englishTitle;
  } else {
    return CATEGORIES[num - 1].frenchTitle;
  }
}

function categoryNameToNum(name) {
  for (let i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].englishTitle === name) {
      return CATEGORIES[i].value;
    }
  }
}

function categoryToColour(num) {
  const category = CATEGORIES[num - 1] || CATEGORIES[CATEGORIES.length - 1];
  return category.colour;
}

// Marker event handler
function markerSelected(marker) {
  moveMapTo(marker.getPosition(), 16);
  userMarkers.forEach(markerInList => {
    if (markerInList.id === marker.id) {
      marker = markerInList;
    }
  });
  if (marker.userPin) {
    // Later need to insert a function that will load editing capabilities for the marker. Maybe
    loadEditMenu(marker);
  } else {
    closeEditMenu();
  }
  if (markerInfo) {
    markerInfo.close();
  }

  markerInfo = new google.maps.InfoWindow({
    content: getInfoContent(marker),
  });
  markerInfo.open(map, marker);
  markerInfo.addListener('closeclick', () => { closeEditMenu(); });
}

// Handles drawing/populating the sidepanel when an editable marker is selected
function loadEditMenu(marker) {
  // Makes elements visible, deletes if shown
  const menu = document.getElementById('menu');
  menu.innerHTML = '';
  menu.style.width = '25%';
  menu.style.paddingLeft = '.5%';
  menu.style.visibility = 'visible';
  // Sets HTML elements on demand. Will set one element per line for readability
  setTimeout(() => {
    let content = '';
    switch (userLanguage) {
      case 'EN':
        content += '<label class=\'sidebar\'>Name: </label><br><input type=text id=editTitle class=\'float-child\' placeholder=\'Name...\'></input>';
        content += '<br><br><label class=sidebar>Category: </label><br><select id=editCategory class=\'float-child\'></select>';
        content += '<br><br><label class=sidebar>Description: </label><br><textarea id=editDescription class=\'float-child\' maxlength=80 placeholder=\'Description...\'></textarea>';
        content += '<br><br><label class=sidebar>Phone Number: </label><br><input type=tel id=editPhone class=\'float-child\' placeholder=\'Phone Number...\'></input>';
        content += '<br><br><label class=sidebar>Email Address: </label><br><input type=email id=editEmail class=\'float-child\' placeholder=\'Email Address...\'></input>';
        content += '<br><br><label class=sidebar>Website: </label><br><input type=url id=editWebsite class=\'float-child\' placeholder=\'Website Address...\'></input>';
        content += '<br><br><label class=sidebar>Address: </label><br><input type=text id=editAddress1 class=\'float-child\' placeholder=\'Address Line 1...\'></input>';
        content += '<br><input type=text id=editAddress2 class=\'float-child\' placeholder=\'Address Line 2...\'></input>';
        content += '<br><input type=text id=editPostcode class=\'float-child\' placeholder=\'Postcode...\'></input>';
        content += '<br><br><label class=sidebar>Additional Information: </label><br><input type=text class=\'float-child\' maxlength=80 id=editExtra></input>';
        content += '<br><br><hr><br><input class=\'float-child\' type=button id=deleteMarkerButton value=\'Delete Marker?\'></input><input class=\'float-child\' type=button id=saveMarkerInfo value=\'Save Changes\'></input>';
        break;

      case 'FR':
        content += '<label class=\'sidebar\'>Nom: </label><br><input type=text id=editTitle class=\'float-child\' placeholder=\'Nom...\'></input>';
        content += '<br><br><label class=sidebar>Catégorie: </label><br><select id=editCategory class=\'float-child\'></select>';
        content += '<br><br><label class=sidebar>Description: </label><br><textarea id=editDescription class=\'float-child\' maxlength=80 placeholder=\'Description...\'></textarea>';
        content += '<br><br><label class=sidebar>Téléphone: </label><br><input type=tel id=editPhone class=\'float-child\' placeholder=\'Téléphone...\'></input>';
        content += '<br><br><label class=sidebar>Email: </label><br><input type=email id=editEmail class=\'float-child\' placeholder=\'Email...\'></input>';
        content += '<br><br><label class=sidebar>Site Internet: </label><br><input type=url id=editWebsite class=\'float-child\' placeholder=\'Site internet...\'></input>';
        content += '<br><br><label class=sidebar>Adresse: </label><br><input type=text id=editAddress1 class=\'float-child\' placeholder=\'Addresse ligne 1...\'></input>';
        content += '<br><input type=text id=editAddress2 class=\'float-child\' placeholder=\'Addresse ligne 2...\'></input>';
        content += '<br><input type=text id=editPostcode class=\'float-child\' placeholder=\'Code Postal...\'></input>';
        content += '<br><br><label class=sidebar>Information additionnelle: </label><br><input type=text class=\'float-child\' maxlength=80 id=editExtra></input>';
        content += '<br><br><hr><br><input class=\'float-child\' type=button id=deleteMarkerButton value="Souhaitez-vous supprimer l\'épingle?"></input><input class=\'float-child\' type=button id=saveMarkerInfo value=\'Mise à jour\'></input>';
        break;
    }

    menu.insertAdjacentHTML('beforeend', content);
    populateSelectField();

    // Set all values in the edit menu to match those of the selected marker
    switch (userLanguage) {
      case 'EN':
        document.getElementById('editTitle').value = marker.title || 'Untitled Marker';
        break;
      case 'FR':
        document.getElementById('editTitle').value = marker.title || 'Marqueur sans titre';
        break;
    }

    menu.marker = marker;
    document.getElementById('editCategory').value = CATEGORIES[marker.category - 1].englishTitle || undefined;
    document.getElementById('editDescription').value = marker.description || '';
    document.getElementById('editPhone').value = marker.phone || '';
    document.getElementById('editEmail').value = marker.email || '';
    document.getElementById('editWebsite').value = marker.website || '';
    document.getElementById('editAddress1').value = marker.address_line_1 || '';
    document.getElementById('editAddress2').value = marker.address_line_2 || '';
    document.getElementById('editPostcode').value = marker.postcode || '';
    document.getElementById('editExtra').value = marker.notes || '';

    // Add event listeners
    document.getElementById('saveMarkerInfo').addEventListener('click', () => {
      saveEditedMarkerInfo(marker);
    });

    document.getElementById('deleteMarkerButton').addEventListener('click', () => {
      handleMarkerDelete(marker);
    });
  }, 400);
}

function closeEditMenu() {
  const menu = document.getElementById('menu');
  menu.style.width = '0%';
  menu.style.paddingLeft = '0%';
  menu.style.visibility = 'hidden';
  menu.innerHTML = '';
}

// Handles event to delete markers
async function handleMarkerDelete(marker) {
  if (window.confirm('Are you sure you want to delete this marker?')) {
    closeEditMenu();
    await deletePinById(marker.id);
    loadMarkers();
  }
}

// Populates the catergory list dropdown in the edit marker field
function populateSelectField() {
  const selectEl = document.getElementById('editCategory');
  CATEGORIES.forEach(category => {
    const newOption = document.createElement('option');
    newOption.value = category.englishTitle;
    if (userLanguage === 'EN') {
      newOption.textContent = category.englishTitle;
    } else {
      newOption.textContent = category.frenchTitle;
    }
    selectEl.appendChild(newOption);
  });
}

// Function to grab edited marker info, convert it to PONToon-friendly data, and sends it off
async function saveEditedMarkerInfo(marker) {
  marker.title = document.getElementById('editTitle').value;
  marker.category = categoryNameToNum(document.getElementById('editCategory').value);
  marker.description = document.getElementById('editDescription').value;
  marker.phone = document.getElementById('editPhone').value;
  marker.email = document.getElementById('editEmail').value;
  marker.website = document.getElementById('editWebsite').value;
  marker.address_line_1 = document.getElementById('editAddress1').value;
  marker.address_line_2 = document.getElementById('editAddress2').value;
  marker.postcode = document.getElementById('editPostcode').value;
  marker.notes = document.getElementById('editExtra').value;

  // Once data is grabbed, convert to Pin data and send to API
  const send = markerToPin(marker);
  await addUserPin(send);
  loadMarkers();
  closeEditMenu();
}

// Gets marker attributes and converts them to HTML
function getInfoContent(marker) {
  let markerContent = "<div class='map-marker-infowindow'>";
  markerContent += `<h2>${marker.title}</h2>`;
  const categoryName = categoryToName(marker.category);
  markerContent += `<h4>${categoryName}</h4>`;
  // Add description
  if (marker.description) { markerContent += `<p>${marker.description}</p>`; }
  // If contact details have been provided, add them
  if (marker.phone || marker.website || marker.email) {
    markerContent += '<h3>Contact:</h3>';
    // Values put in to each span to prevent new lines from being created
    if (marker.phone) { markerContent += `<p><span class="english-text"><u>Phone number:</u> ${marker.phone}</span><span class="french-text"><u>Téléphone:</u> ${marker.phone}</span></p>`; }
    if (marker.email) { markerContent += `<p><span class="english-text"><u>Email address:</u> ${marker.email}</span><span class="french-text"><u>Email:</u> ${marker.email}</span></p>`; }
    if (marker.website) { markerContent += `<p><span class="english-text"><u>Website:</u> <a href=${marker.website} target="_blank">${marker.website}</a></span><span class="french-text"><u>Site Internet:</u> <a href=${marker.website} target="_blank">${marker.website}</a></span></p>`; }
  }
  // If address details have been provided, add them
  if (marker.address_line_1 || marker.address_line_2 || marker.postcode) {
    markerContent += '<h3><span class="english-text">Address:</span><span class="french-text">Adresse:</span></h3>';
    if (marker.address_line_1) { markerContent += `<p>${marker.address_line_1}</p>`; }
    if (marker.address_line_2) { markerContent += `<p>${marker.address_line_2}</p>`; }
    if (marker.postcode) { markerContent += `<p>${marker.postcode}</p>`; }
  }
  if (marker.notes) { markerContent += `<h3><span class="english-text">Additional Information:</span><span class="french-text">Information additionnelle:</span></h3><p>${marker.notes}</p>`; }
  markerContent = markerContent + '</div>';

  return markerContent;
}

document.getElementById('pontoonLogo').addEventListener('click', () => {
  window.location.href = 'pontoonapps.com';
});
