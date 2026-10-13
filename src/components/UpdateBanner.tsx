import { applyUpdate, useUpdateAvailable } from '../lib/updates';

export default function UpdateBanner() {
  if (!useUpdateAvailable()) return null;
  return (
    <div className="update-banner" role="status">
      <span>A new version of Faith is ready.</span>
      <button className="btn small primary" onClick={() => void applyUpdate()}>
        Refresh
      </button>
    </div>
  );
}
