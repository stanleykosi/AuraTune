declare namespace SpotifyApi {
  interface TrackObjectFull {
    id: string;
    name: string;
    artists: Array<{
      id: string;
      name: string;
    }>;
    album: {
      id: string;
      name: string;
      images: Array<{
        url: string;
        height: number;
        width: number;
      }>;
    };
    duration_ms: number;
    uri: string;
  }
} 