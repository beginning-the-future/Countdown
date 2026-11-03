(() => {
'use strict';
let auth, db, sdk, user = null, unsubscribe, generation = 0, ready = false, busy = false;
const el = id => document.getElementById(id);
const status = message => { el('authStatus').textContent = message; };
function publish(clocks = []) {
  window.dispatchEvent(new CustomEvent('time-account', {detail:{user, clocks, ready}}));
}
function controls() {
  el('signIn').hidden = !!user;
  el('signOut').hidden = !user;
  el('signOut').disabled = busy;
  el('accountName').textContent = user ? (user.displayName || user.email || 'Google account') : 'Your private timeline';
  el('accountEmail').textContent = user ? (user.email || '') : 'Sign in to save your countdowns across devices.';
}
function explain(error) {
  const messages = {
    'auth/popup-blocked':'Allow pop-ups for this website, then try again.',
    'auth/popup-closed-by-user':'Sign-in cancelled. You can try again.',
    'auth/cancelled-popup-request':'A sign-in window is already open.',
    'auth/unauthorized-domain':'Add this website domain in Firebase Authentication → Settings → Authorized domains.',
    'auth/operation-not-allowed':'Enable Google in Firebase Authentication → Sign-in method.',
    'auth/network-request-failed':'Unable to connect. Check your internet connection.',
    'permission-denied':'Access denied. Publish the supplied Firestore security rules.',
    'unavailable':'Cloud storage is unavailable. Check your connection and retry.'
  };
  return messages[error.code] || `Could not complete the request (${error.code || error.message || 'unknown error'}).`;
}
window.TIMECloud = {
  get ready(){return ready && !!user && !busy;},
  get uid(){return user?.uid;},
  async write(items = [], deleted = []) {
    if (!this.ready) throw new Error('Sign in and wait for your timeline to load.');
    if (!navigator.onLine) throw new Error('Reconnect to the internet before saving.');
    const uid = user.uid, session = generation;
    busy = true; controls(); status('Saving to your account…');
    try {
      if(items.length + deleted.length > 400) throw new Error('Import at most 400 countdowns at a time.');
      const batch = sdk.writeBatch(db);
      items.forEach(clock => batch.set(sdk.doc(db,'users',uid,'countdowns',clock.id),clock));
      deleted.forEach(id => batch.delete(sdk.doc(db,'users',uid,'countdowns',id)));
      await batch.commit();
      if(session !== generation) throw new Error('Account changed. Reload your timeline before continuing.');
      status('Saved to your account');
    } catch(error) {status(explain(error)); throw error;}
    finally {busy = false; controls();}
  }
};
el('signOut').addEventListener('click', async () => {
  if(busy) return;
  try {await sdk.signOut(auth);} catch(error) {status(explain(error));}
});
el('signIn').addEventListener('click', async () => {
  if(!auth) return;
  el('signIn').disabled = true;
  try {
    const provider = new sdk.GoogleAuthProvider();
    provider.setCustomParameters({prompt:'select_account'});
    await sdk.signInWithPopup(auth,provider);
  } catch(error) {status(explain(error));}
  finally {el('signIn').disabled = false;}
});
async function start() {
  controls();
  const config = window.TIME_FIREBASE_CONFIG;
  if(!config || ['apiKey','authDomain','projectId','appId'].some(key => !config[key])) {
    el('signIn').disabled = true;
    status('Setup required: add your Firebase web configuration. See GOOGLE-LOGIN-SETUP.md.'); return;
  }
  if(location.protocol === 'file:') {
    el('signIn').disabled = true;
    status('Open TIME using localhost or an HTTPS website. Google sign-in cannot run from a double-clicked HTML file.'); return;
  }
  try {
    status('Connecting securely…');
    const [core,authentication,firestore] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js')
    ]);
    sdk = {...authentication,...firestore};
    const app = core.initializeApp(config);
    auth = sdk.getAuth(app); db = sdk.getFirestore(app);
    await sdk.setPersistence(auth,sdk.browserSessionPersistence);
    el('signIn').disabled = false;
    sdk.onAuthStateChanged(auth, current => {
      const session = ++generation;
      if(unsubscribe) unsubscribe();
      user = current; ready = false; publish(); controls();
      if(!user) {status('Sign in with Google to open your countdowns.');return;}
      status('Loading your timeline…');
      unsubscribe = sdk.onSnapshot(sdk.collection(db,'users',user.uid,'countdowns'),{includeMetadataChanges:true}, snapshot => {
        if(session !== generation || snapshot.metadata.hasPendingWrites) return;
        // Wait for the server once per session; never use a cached empty result as authoritative.
        if(!ready && snapshot.metadata.fromCache) return;
        ready = true;
        publish(snapshot.docs.map(d => ({...d.data(),id:d.id})));
        if(!busy) status(snapshot.metadata.fromCache ? 'Offline — showing last loaded countdowns' : 'Private timeline · Cloud connected');
      }, error => {
        if(session !== generation) return;
        ready = false; publish(); status(explain(error));
      });
    }, error => {ready=false; publish(); status(explain(error));});
  } catch(error) {el('signIn').disabled=true; status(explain(error));}
}
start();
})();
