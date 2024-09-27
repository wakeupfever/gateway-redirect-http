const data = {
  location: window.location.href,
  token:
    window.sessionStorage.getItem('token') ||
    window.localStorage.getItem('token')
}
chrome.storage.local.set({ web: JSON.stringify(data) })
