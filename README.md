# CommunityMap

## Deployment onto PontoonApps.com

* To deploy the app, place the contents of the 'dir' folder onto the Pontoon server wherever needed.

## Configuration

### API Keys

* PONToon API Key - Located at the start of `./dir/script.js`, change there if a new API key is required
* Google API Key - Located in `./dir/index.html` in the third script in the header. If new key is required, change `src` attribute to "https://maps.googleapis.com/maps/api/js?key=NEWAPIKEY&callback=initPage&libraries=&v=weekly" where "NEWAPIKEY" is replaced with the newly acquired key

### Marker Details

* The SVG string for the markers was adapted from `./Pin_1.svg` and is stored as `MARKER_SVG` in `./dir/markerStyleConfig.js`. Change there if desired.
* Marker categories are stored as objects under the name `CATEGORIES` in `./dir/markerStyleConfig.js`. Any changes/additions should be made there.
  * `colour` is an RGB hex triplet.
  * `englishTitle` is the name of the category in English.
  * `frenchTitle` is the name of the category in French.
  * `value` is an incrementing integer assigned to each category, starting at 1 to remain consistent with the mobile deployment.

Be cautious if removing categories or attempting to change their values as the map pins are stored in the database with their category value, and if their category value cannot be found in `CATEGORIES`, the pin will fail to appear on the map


## Guest Accounts

* If a training centre wishes to allow guests to view their map without needing to be logged in, they can do so in the app through the use of a switch which activates the `setCentreGuestAccount()` function
* The URL that guests need to follow is the community map URL, followed by `?tc=TRAINING_CENTRE_EMAIL` where "TRAINING_CENTRE_EMAIL" is the email address that the training centre is registered with on the PONToon system
* Currently the guest link cannot be auto-generated. This is due to the API not giving access to the email of the currently logged in user
  * Recommended fix for this if desired would be to edit `/community-api/v2/login` in the API to return the email address of the user if they are of type 'recruiter'. Then store this information in the script in the `userTypeCheck()` function.

## Translation

* Translation between English and French is done by creating two `<span>` elements for all text items. One span will have the text in English, and the other will have the text in French. The spans must be assigned the classes `english-text` and `french-text` respectively.
* The CSS stores the visibility of English and French text in the variables  `--englishVisibility` and `--frenchVisibility`, these variables are then assigned to the elements `display` attribute in the CSS using their class selectors.
* Community Map uses the same Cookie as Career Guide, `PONTOON_CG_LANG`, to store the user's language selection in the browser, however the variable `userLanguage` is used throughout the app when creating new elements.

## API Functions

### API Return Codes

* 200 - Get request success
* 204 - Post request success
* 400 - Bad request when data is malformed/unsuited
* 401 - Invalid request credentials
* 403 - Error when request is of wrong user type
* 409 - Conflict if update requested, but ID doesn't exist in database

### GET

#### `userTypeCheck()`

* Will request the type of user that the current account is signed up as.
* Takes no parameters.
* Returns nothing, but assigns `userType` a value for use elsewhere.

#### `getUserPins()`

* Will request a list of all pins that user has access to.
* Takes no parameters.
* Returns array of objects, consisting of pins from user's account.

#### `getSubscribedUsers()`

* Will request a list of all users subscribed to the current training centre.
* Takes no parameters.
* Returns a list of email addresses of subscribed users.

#### `getTrainingCentres()`

* Will request a list of all training centres the current user is subscribed to.
* Takes no parameters.
* Returns an array of training centre objects.

### POST

#### `addUserPin(data)`

* Will add a pin to the database.
* `data` is a pin object.
* Returns a response from the server.

#### `deletePinById(pinId)`

* Will remove pin from database, given it's id. Only if pin was created by the current user.
* `pinId` is an integer value representing the id of the pin to be deleted.
* Returns nothing.

#### `deletePinByName(pinName)`

* Will remove pin from database, given it's name. Only if pin was created by the current user.
* `pinName` should be an integer value representing the id of the pin to be deleted.
* Returns nothing.

#### `addUsersToCentre(listOfEmails)`

* Will update the database and add users to the current training centre.
* `listOfEmails` is a **list** of strings corresponding to the email addresses of users to be added.
* Returns false if user is of incorrect type, but otherwise returns response from the server.

#### `removeUsersFromCentre(listOfEmails)`

* Will update the database and remove users from the current training centre based on their emails.
* `listOfEmails` is a **list** of strings corresponding to the email addresses of users to be removed.
* Returns false if user is of incorrect type, but otherwise returns response from the server.

#### `unsubscribeFrom(centreEmail)`

* Will update the database and remove the current user from the training centre associated with the email.
* `centreEmail` is an object containing information about the given training centre.
* Returns false if user is of incorrect type, but otherwise returns nothing.

---

## Geolocation Functions

#### `canGeolocate()`

* Attempts to get user's geolocation position. Used in `showMap()` as a way of checking if geolocation is available to the user.
* Takes no parameters.
* Returns promise with either user position if successful, or an error if unsuccessful.

#### `moveMapTo(position, zoom = 13)`

* Moves the map so that the co-ordinates specified in `position` are in the centre of the screen, and the zoom level will be set to the value in `zoom`.
* `position` should be an object with `lat` and `lng` as attributes, each having valid co-ordinate values. `zoom` should be an integer representing the desired zoom level. Default value is 13.
* Returns nothing.

#### `centreMapOnUser()`

* Will attempt to centre the map on the user's position. Should always be possible because the function will only be callable if `canGeolocate()` has previously returned successfully.
* Takes no parameters.
* Returns nothing.

---

## Map Marker Functions

#### `createNewMarker(pos = null)`

* Handles code for event when a new marker is created by the user and dropped on the page.
* `pos` is the current map position, set to null when called.
* Returns nothing.

#### `markerDropped(marker)`

* Calls functions to convert a new marker to a PONToon pin and upload it to the database.
* `marker` is the created marker object.
* Returns response from PONToon database.

#### `pinToMarker(pinObj)`

* Converts a pin object that's been retrieved from the PONToon API into a Marker object in line with the Google Maps API.
* `pinObj` is a pin object in JSON.
* returns an object ready to be passed into `new google.maps.Marker()`.

#### `markerToPin(markerObj)`

* Converts a marker object that's used by Maps API into a pin object ready to be posted to PONToon database.
* `markerObj` is a marker object in JSON.
* returns an object ready to be passed into `addUserPin(data)`.

#### `removeAllMarkers()`

* Clears screen of all markers; clears array of held markers. Called when updating markers in other functions.
* Takes no parameters.
* Returns nothing.

#### `loadMarkers()`

* Calls markers from the database linked to the current user and sets them up to be drawn onto the page.
* Takes no parameters.
* Returns nothing.

#### `renderMarkers(excluding)`

* Draws markers on the page from the retrieved user markers. Will not draw exclusions.
* `excluding` is a list of training centre objects to exclude from the rendered marker list.
* Returns nothing.

#### `markerSelected(marker)`

* Event handler for map markers. Will open info windows where users can view info and recruiters can append info.
* `marker` is a marker object, passed in by the event listener.
* Returns nothing.

#### `loadEditMenu(marker)`

* Event handler for map markers. Will open the sidebar edit menu for users/recruiters to change and delete existing markers.
* `marker` is a marker object.
* Returns nothing.

#### `handleMarkerDelete(marker)`

* Separate async function to handle deleting markers.
* `marker` is a marker object.
* Returns nothing.

#### `getInfoContent(marker)`

* Converts the marker attributes into a HTML div ready to be displayed
* `marker` is a marker object.
* Returns the HTML in the form of a string containing HTML elements.

#### `editMarkerInfo(marker)`

* Displays a form suited to pin info editing, populates with any existing info.
* `marker` is a marker object.
* Returns the HTML in the form of a string.

#### `saveEditedMarkerInfo(marker)`

* Grabs edited marker info with retrieved elements on the page, then saves it to the database.
* `marker` is the selected marker object.
* Returns nothing.
