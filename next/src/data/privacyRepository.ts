import { loadProgressPhotos, removeProgressPhoto } from './progressPhotoRepository';

const NEXT_STORAGE_PREFIX = 'fitcoach_next_';

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

  return {
    removedStorageKeys: keys.length,
    removedPhotos: photos.length,
  };
}
