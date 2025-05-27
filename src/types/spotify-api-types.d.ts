declare namespace SpotifyApi {
  interface TrackObjectFull {
    id: string;
    name: string;
    artists: ArtistObjectSimplified[];
    album: AlbumObjectSimplified;
  }

  interface ArtistObjectSimplified {
    id: string;
    name: string;
  }

  interface AlbumObjectSimplified {
    id: string;
    name: string;
    images: ImageObject[];
  }

  interface ImageObject {
    url: string;
    height: number;
    width: number;
  }
} 