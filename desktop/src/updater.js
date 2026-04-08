// Inject update banner into the web app when update is ready
// This file is injected via webContents.executeJavaScript

const updateBanner = `
(function() {
  if (window.__updateBannerShown) return;
  window.__updateBannerShown = true;

  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.style.cssText = \`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #185FA5;
    color: white;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    z-index: 99999;
    font-family: -apple-system, sans-serif;
  \`;
  banner.innerHTML = \`
    <span>🎉 A new version of 10x Chat is ready!</span>
    <button onclick="window.electronAPI?.restartAndInstall()" style="
      background: white;
      color: #185FA5;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 12px;
    ">Restart & Update</button>
  \`;
  document.body.prepend(banner);
})();
`
module.exports = { updateBanner }
