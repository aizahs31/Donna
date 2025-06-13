import { useState } from "react";
import quotes from "../data/quotes";

export default function ShowSpotify() {
    const [showPopup, setShowPopup] = useState(false);
    const [playlistUrl, setPlaylistUrl] = useState("");
    const [embedUrl, setEmbedUrl] = useState("https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator&theme=0");
    const [tempUrl, setTempUrl] = useState("");
    const [showPlayer, setShowPlayer] = useState(false);
    const [currentQuote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);

    const getEmbedUrl = (url) => {
        const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
        return match ? `https://open.spotify.com/embed/playlist/${match[1]}?utm_source=generator&theme=0` : "";
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

    const SpotifyButton = ({ onClick, children }) => (
        <button
            onClick={onClick}
            style={{
                background: 'var(--color-accent)',
                color: 'var(--color-text-light)',
                border: '2px var(--color-border-dark) solid',
                height: '48px',
                borderRadius: '10px',
                padding: '0 16px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                whiteSpace: 'normal',
                textAlign: 'center',
                lineHeight: '1.2',
                width: '100%',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                // overflow: 'hidden',
            }}
            className="spotify-playlist-btn"
        >
            <span>{children}</span>
        </button>
    );

    return (
        <div style={{
            width: '100%',
            height: '152px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
        }}>
            {!showPlayer ? (
                // Quote Display with Play Music Button on the left
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '32px',
                    width: '100%',
                    padding: '0 40px',
                    height: '100%'
                }}>
                    {/* Play Music Button */}
                    <div style={{
                        width: '80px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        height: '100%',
                    }}>
                        <SpotifyButton onClick={() => setShowPlayer(true)}>
                            Play music
                        </SpotifyButton>
                    </div>

                    {/* Quote Display */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        textAlign: 'center',
                        flex: 1,
                        maxWidth: '600px'
                    }}>
                        <p style={{
                            margin: 0,
                            fontSize: '1.5rem',
                            fontFamily: "'Playfair Display', serif",
                            color: 'var(--color-text-main)',
                            fontStyle: 'italic',
                            lineHeight: 1.4
                        }}>
                            "{currentQuote.text}"
                        </p>
                        <p style={{
                            margin: 0,
                            fontSize: '1rem',
                            color: 'var(--color-text-secondary)',
                            fontFamily: "'Playfair Display', serif"
                        }}>
                            — {currentQuote.author}
                        </p>
                    </div>
                </div>
            ) : (
                // Spotify Player
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: '20px',
                    width: '100%',
                    height: '100%',
                    // backgroundColor: 'var(--color-bg-overlay)',
                }}>
                    {/* Buttons Column */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        width: '80px',
                        flexShrink: 0,
                        justifyContent: 'center',
                        height: '100%',
                    }}>
                        <SpotifyButton onClick={() => { setTempUrl(playlistUrl); setShowPopup(true); }}>
                            Change playlist
                        </SpotifyButton>
                        <SpotifyButton onClick={() => setShowPlayer(false)}>
                            Close playlist
                        </SpotifyButton>
                    </div>

                    {/* Spotify Embed */}
                    <iframe
                        style={{
                            borderRadius: '14px',
                            width: '100%',
                            height: '152px',
                            border: 'none',
                            backgroundColor: 'var(--color-bg-overlay)',
                        }}
                        src={embedUrl}
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        allowFullScreen=""
                    ></iframe>
                </div>
            )}

            {/* Popup */}
            {showPopup && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <div style={{
                        backgroundColor: 'var(--color-bg-panel)',
                        borderRadius: '15px',
                        border: '2px solid var(--color-border-dark)',
                        maxWidth: '300px',
                        animation: 'modalSlide 0.3s ease',
                        padding: '32px 24px',
                        minWidth: 320,
                        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}>
                        <h3 style={{ margin: 0, marginBottom: 18, fontWeight: 600, fontSize: '1.1rem', color: 'var(--color-text-main)' }}>Paste your Spotify playlist link</h3>
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
                                border: '2px solid var(--color-border-dark)',
                                marginBottom: 18,
                                outline: 'none',
                                backgroundColor: 'var(--color-accent-input)',
                                color: 'var(--color-text-muted)',
                            }}
                        />
                        <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
                            <button
                                onClick={handleCancel}
                                style={{
                                    background: 'var(--color-bg-panel)',
                                    color: 'var(--color-text-dark)',
                                    borderRadius: '30px',
                                    border: '2px solid var(--color-border-dark)',
                                    padding: '10px 20px',
                                    fontWeight: 500,
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                            >Cancel</button>
                            <button
                                onClick={handleApply}
                                style={{
                                    background: tempUrl && getEmbedUrl(tempUrl)
                                        ? 'var(--color-border-dark)'
                                        : '#ccc',
                                    color: 'var(--color-text-light)',
                                    border: 'none',
                                    borderRadius: '30px',
                                    padding: '10px 20px',
                                    fontWeight: 500,
                                    fontSize: '1rem',
                                    cursor: tempUrl && getEmbedUrl(tempUrl) ? 'pointer' : 'not-allowed',
                                    opacity: tempUrl && getEmbedUrl(tempUrl) ? 1 : 0.4,
                                    transition: 'all 0.3s ease',
                                    boxShadow: tempUrl && getEmbedUrl(tempUrl)
                                        ? '0 2px 8px rgba(0,0,0,0.2)'
                                        : 'none'
                                }}
                                disabled={!tempUrl || !getEmbedUrl(tempUrl)}
                            >Apply</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .spotify-playlist-btn:hover {
                    background: #1E1E1E !important;
                    color: #FEF9F1 !important;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }
                .spotify-playlist-btn:active {
                    transform: translateY(0px);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                .spotify-playlist-btn span {
                    transition: color 0.3s ease;
                }
                .spotify-playlist-btn:hover span {
                    color: #FEF9F1 !important;
                }
                @media (max-width: 900px) {
                    .spotify-playlist-btn {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
