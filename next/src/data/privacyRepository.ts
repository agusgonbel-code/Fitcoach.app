import { loadProgressPhotos, removeProgressPhoto } from './progressPhotoRepository';

const NEXT_STORAGE_PREFIX = 'fitcoach_next_';
export const LEGACY_MIGRATION_SUPPRESSION_KEY = 'fitcoach_next_legacy_migration_suppressed_v1';

export interface PrivacyDeletionResult {
  removedStorageKeys: number;
  removedPhotos: number;
}

interface ProgressPhotoStore {
  load: typeof loadProgressPhotos;
  remove: typeof removeProgressPhoto;
}

const defaultPhotoStore: ProgressPhotoStore = {
  load: loadProgressPhotos,
  remove: removeProgressPhoto,
};

export async function deleteAllFitCoachNextData(
  storage: Storage = localStorage,
  photoStore: ProgressPhotoStore = defaultPhotoStore,
): Promise<PrivacyDeletionResult> {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(NEXT_STORAGE_PREFIX)) keys.push(key);
  }

  const photos = await photoStore.load();

  for (const key of keys) storage.removeItem(key);
  for (const photo of photos) await photoStore.remove(photo.id);

  // Privacy deletion must not silently recreate Next data from a preserved legacy
  // installation on the following reload. This tombstone records the user's explicit
  // choice to start Next empty while leaving the older app's storage untouched.
  storage.setItem(LEGACY_MIGRATION_SUPPRESSION_KEY, 'true');

  return {
    removedStorageKeys: keys.length,
    removedPhotos: photos.length,
  };
}
