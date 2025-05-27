import { useState } from "react";

export default function ShowSpotify() {
    const [showPopup, setShowPopup] = useState(false);
    const [playlistUrl, setPlaylistUrl] = useState("");
    const [embedUrl, setEmbedUrl] = useState("https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator");
    const [tempUrl, setTempUrl] = useState("");

    const getEmbedUrl = (url) => {
        const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
        return match ? `https://open.spotify.com/embed/playlist/${match[1]}` : "";
    };

    const handleApply = () => {
        const embed = getEmbedUrl(tempUrl);
        if (embed) {
            setEmbedUrl(embed);
            setPlaylistUrl(tempUrl);
            setShowPopup(false);
        }
    };

    const handleCancel = () => {
        setTempUrl(playlistUrl);
        setShowPopup(false);
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <iframe
                style={{ borderRadius: '12px', width: '350px', height: '152px', maxWidth: 600, border: 'none' }}
                src={embedUrl}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                allowFullScreen=""
            ></iframe>
            <button
                style={{
                    background: 'transparent',
                    color: '#1E1E1E',
                    border: 'none',
                    height: '100%',
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 'calc(100% - 370px)', // 350px iframe + 20px gap
                    minWidth: 120,
                    maxWidth: 200,
                }}
                className="spotify-playlist-btn"
                onClick={() => { setTempUrl(playlistUrl); setShowPopup(true); }}
            >
                <span className="spotify-playlist-btn-text">Play your playlist</span>
                <span style={{ marginTop: 6, fontSize: 24, color: '#1DB954' }}>
                    <svg width="35" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 12H38M38 12L24 2M38 12L24 22" stroke="#1E1E1E" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </span>
            </button>
            <style>{`
                .spotify-playlist-btn-text {
                    transition: text-shadow 0.2s;
                }
                .spotify-playlist-btn:hover .spotify-playlist-btn-text {
                    text-shadow: 0 2px 8px rgb(142, 142, 142);
                }
                .spotify-playlist-btn:hover {
                    transform: scale(1.03);
                    transition: transform 0.2s ease-in-out;
                }
                @media (max-width: 900px) {
                    .spotify-playlist-btn {
                        display: none !important;
                    }
                }
            `}</style>
            {showPopup && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.45)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <div style={{
                        background: '#FEF9F1',
                        borderRadius: '15px',
                        border: '2px solid #1E1E1E',
                        padding: '32px 24px',
                        minWidth: 320,
                        maxWidth: 350,
                        width: '90%',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}>
                        <h3 style={{ margin: 0, marginBottom: 18, fontWeight: 600, fontSize: '1.1rem', color: '#1E1E1E' }}>Paste your Spotify playlist link</h3>
                        <input
                            type="text"
                            value={tempUrl}
                            onChange={e => setTempUrl(e.target.value)}
                            placeholder="Spotify playlist URL"
                            style={{
                                width: '100%',
                                padding: '10px',
                                fontSize: '1rem',
                                borderRadius: 10,
                                border: '2px solid #1E1E1E',
                                marginBottom: 18,
                                outline: 'none',
                                background: '#FFD8DF',
                                color: '#222',
                            }}
                        />
                        <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
                            <button
                                onClick={handleCancel}
                                style={{
                                    background: '#747474',
                                    color: '#FEF9F1',
                                    borderRadius: '30px',
                                    border: '2px solid #1E1E1E',
                                    padding: '8px 18px',
                                    fontWeight: 500,
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                }}
                            >Cancel</button>
                            <button
                                onClick={handleApply}
                                style={{
                                    background: '#1E1E1E',
                                    color: '#FEF9F1',
                                    border: 'none',
                                    borderRadius: '30px',
                                    padding: '8px 18px',
                                    fontWeight: 500,
                                    fontSize: '1rem',
                                    cursor: tempUrl && getEmbedUrl(tempUrl) ? 'pointer' : 'not-allowed',
                                    opacity: tempUrl && getEmbedUrl(tempUrl) ? 1 : 0.4,
                                }}
                                disabled={!tempUrl || !getEmbedUrl(tempUrl)}
                            >Apply</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}