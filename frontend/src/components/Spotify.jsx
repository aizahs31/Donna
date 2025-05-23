export default function ShowSpotify() {
    const playlist = `<iframe 
    style="border-radius:12px"
    src="https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator"
    width="350px"
    height="152"
    frameBorder="0"
    allowfullscreen=""
    allow="autoplay;
        clipboard-write;
        encrypted-media;
        fullscreen; picture-in-picture"
    loading="lazy"></iframe>`;
    
    return(
        // Check this out
        <div dangerouslySetInnerHTML={{__html: playlist}}></div>    
    )
}

// import { useState } from "react";

// export default function PlaySpotify() {
//     const [playlistUrl, setUrl] = useState("")

//     const getEmbedUrl = (url) => {
//         const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
//         return match ? `https://open.spotify.com/embed/playlist/${match[1]}` : "";
//     };

    
    
//     return (
//     <div>
//       <input
//         type="text"
//         placeholder="Paste Spotify playlist URL"
//         value={playlistUrl}
//         onChange={(e) => setUrl(e.target.value)}
//         style={{ width: "100%", padding: "10px", fontSize: "16px" }}
//       />
//       {getEmbedUrl(playlistUrl) && (
//         <iframe
//           src={getEmbedUrl(playlistUrl)}
//           width="100%"
//           height="380"
//           frameBorder="0"
//           allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
//           loading="lazy"
//           style={{ marginTop: "20px", borderRadius: "12px" }}
//         ></iframe>
//       )}
//     </div>
//   );
// }