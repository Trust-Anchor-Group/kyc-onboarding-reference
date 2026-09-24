"use client";
import Image from "next/image";

export default function StoreDownloadButtons({
  appStoreHref = "https://apps.apple.com/gb/app/neuro-access/id6446863270",
  googlePlayHref = "https://play.google.com/store/apps/details?id=com.tag.NeuroAccess&pcampaignid=web_share",
}) {
  const base =
    "flex items-center justify-center transition active:scale-95";
  const pulse = "animate-pulse";

  return (
    <div className="flex flex-col items-center w-full">
      <a
        href={appStoreHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} ${pulse}`}
        aria-label="Download on the App Store"
        style={{ minHeight: 54 }}
      >
        <Image
          src="/icons/store.png"
          alt="App Store"
          width={170}
          height={40}
          style={{ maxWidth: '100%', height: 'auto' }}
          priority
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAAAoCAYAAABw1Q0UAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5QwYFjQw2Qk6JwAAAB1pVFh0Q29tbWVudAAAAAAAvK6ymQAAABl0RVh0U29mdHdhcmUAAHja2d6gAAAAAElFTkSuQmCC"
        />
      </a>

      <a
        href={googlePlayHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} ${pulse}`}
        aria-label="Get it on Google Play"
        style={{ minHeight: 54 }}
      >
        <Image
          src="/icons/play.png"
          alt="Google Play"
          width={170}
          height={40}
          style={{ maxWidth: '100%', height: 'auto' }}
          priority
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAAAoCAYAAABw1Q0UAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5QwYFjQw2Qk6JwAAAB1pVFh0Q29tbWVudAAAAAAAvK6ymQAAABl0RVh0U29mdHdhcmUAAHja2d6gAAAAAElFTkSuQmCC"
        />
      </a>
    </div>
  );
}
