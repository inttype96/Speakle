import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getAccessToken } from '@/store/auth';

interface SpotifyProfile {
    id: string;
    display_name: string;
    email: string;
    country: string;
}

interface CurrentPlayback {
    is_playing: boolean;
    item?: {
        name: string;
        artists: Array<{ name: string }>;
        album: { name: string; images: Array<{ url: string }> };
        duration_ms: number;
    };
    progress_ms: number;
}

const SpotifyTestDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState<string | null>(null);
    const [profile, setProfile] = useState<SpotifyProfile | null>(null);
    const [currentPlayback, setCurrentPlayback] = useState<CurrentPlayback | null>(null);
    const [playlists, setPlaylists] = useState<any>(null);
    const [status, setStatus] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // 인증 상태 확인
    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login?redirect=/spotify-dashboard');
        }
    }, [navigate]);

    const getAuthHeaders = (): Record<string, string> => {
        const token = getAccessToken();
        console.log('인증 스토어에서 가져온 토큰:', token ? `${token.substring(0, 20)}...` : 'null');

        if (!token) {
            console.warn('유효하지 않은 토큰');
            return {
                'Content-Type': 'application/json'
            };
        }

        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    const apiCall = async (endpoint: string, method: 'GET' | 'POST' = 'GET') => {
        try {
            setError(null);
            setLoading(endpoint);

            const response = await fetch(`https://j13c104.p.ssafy.io/api/spotify${endpoint}`, {
                method,
                headers: getAuthHeaders(),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(`${endpoint} 요청 실패: ${errorMessage}`);
            throw err;
        } finally {
            setLoading(null);
        }
    };

    const handleGetProfile = async () => {
        try {
            const data = await apiCall('/profile');
            setProfile(data);
        } catch (err) {
            console.error('프로필 조회 실패:', err);
        }
    };

    const handleGetCurrentPlayback = async () => {
        try {
            const data = await apiCall('/player');
            setCurrentPlayback(data);
        } catch (err) {
            console.error('재생 정보 조회 실패:', err);
        }
    };

    const handleGetPlaylists = async () => {
        try {
            const data = await apiCall('/playlists');
            setPlaylists(data);
        } catch (err) {
            console.error('플레이리스트 조회 실패:', err);
        }
    };

    const handleGetStatus = async () => {
        try {
            const data = await apiCall('/status');
            setStatus(data);
        } catch (err) {
            console.error('상태 조회 실패:', err);
        }
    };

    const handlePlayControl = async (action: 'play' | 'pause' | 'next' | 'previous') => {
        try {
            const result = await apiCall(`/player/${action}`, 'POST');
            console.log(`${action} 성공:`, result?.message || '성공');
            // 재생 정보 업데이트
            setTimeout(() => handleGetCurrentPlayback(), 1000);
        } catch (err) {
            console.error(`${action} 실패:`, err);
        }
    };

    const formatDuration = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px',
            background: '#f5f5f5',
            minHeight: '100vh'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1db954, #1ed760)',
                color: 'white',
                padding: '30px',
                borderRadius: '12px',
                marginBottom: '30px',
                textAlign: 'center'
            }}>
                <h1 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>Spotify API 테스트 대시보드</h1>
                <p style={{ margin: 0, opacity: 0.9 }}>연결된 Spotify 계정의 기능들을 테스트해보세요</p>

                {/* 토큰 상태 표시 */}
                <div style={{ marginTop: '15px', fontSize: '12px', opacity: 0.8 }}>
                    {(() => {
                        const token = getAccessToken();
                        if (!token) {
                            return '❌ JWT 토큰이 없습니다. 먼저 로그인해주세요.';
                        }
                        return `✅ JWT 토큰: ${token.substring(0, 20)}...`;
                    })()}
                </div>
            </div>

            {error && (
                <div style={{
                    background: '#ffebee',
                    color: '#d32f2f',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #f44336'
                }}>
                    {error}
                </div>
            )}

            {/* 기본 정보 조회 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>연결 상태</h3>
                    <button
                        onClick={handleGetStatus}
                        disabled={loading === '/status'}
                        style={{
                            background: '#1db954',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginBottom: '15px'
                        }}
                    >
                        {loading === '/status' ? '조회 중...' : '상태 확인'}
                    </button>
                    {status && (
                        <div style={{ fontSize: '14px', color: '#666' }}>
                            <p>연결 상태: {status.connected ? '✅ 연결됨' : '❌ 연결 안됨'}</p>
                            <p>권한: {status.scope}</p>
                            {status.expiresAtEpochSec && (
                                <p>만료 시간: {new Date(status.expiresAtEpochSec * 1000).toLocaleString()}</p>
                            )}
                        </div>
                    )}
                </div>

                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>사용자 프로필</h3>
                    <button
                        onClick={handleGetProfile}
                        disabled={loading === '/profile'}
                        style={{
                            background: '#1db954',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginBottom: '15px'
                        }}
                    >
                        {loading === '/profile' ? '조회 중...' : '프로필 조회'}
                    </button>
                    {profile && (
                        <div style={{ fontSize: '14px', color: '#666' }}>
                            <p><strong>이름:</strong> {profile.display_name}</p>
                            <p><strong>ID:</strong> {profile.id}</p>
                            <p><strong>이메일:</strong> {profile.email}</p>
                            <p><strong>국가:</strong> {profile.country}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 현재 재생 정보 */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>현재 재생 중</h3>
                <button
                    onClick={handleGetCurrentPlayback}
                    disabled={loading === '/player'}
                    style={{
                        background: '#1db954',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginBottom: '15px'
                    }}
                >
                    {loading === '/player' ? '조회 중...' : '재생 정보 조회'}
                </button>

                {currentPlayback && (
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {currentPlayback.item?.album?.images?.[0] && (
                            <img
                                src={currentPlayback.item.album.images[0].url}
                                alt="Album cover"
                                style={{ width: '80px', height: '80px', borderRadius: '8px' }}
                            />
                        )}
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            {currentPlayback.item ? (
                                <>
                                    <h4 style={{ margin: '0 0 5px 0' }}>{currentPlayback.item.name}</h4>
                                    <p style={{ margin: '0 0 5px 0', color: '#666' }}>
                                        {currentPlayback.item.artists.map(artist => artist.name).join(', ')}
                                    </p>
                                    <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px' }}>
                                        {currentPlayback.item.album.name}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                                        {formatDuration(currentPlayback.progress_ms)} / {formatDuration(currentPlayback.item.duration_ms)}
                                    </p>
                                </>
                            ) : (
                                <p style={{ margin: 0, color: '#666' }}>재생 중인 음악이 없습니다</p>
                            )}
                        </div>
                    </div>
                )}

                {/* 재생 컨트롤 */}
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => handlePlayControl('previous')}
                        disabled={loading?.includes('/player/')}
                        style={{
                            background: '#333',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        ⏮ 이전
                    </button>
                    <button
                        onClick={() => handlePlayControl(currentPlayback?.is_playing ? 'pause' : 'play')}
                        disabled={loading?.includes('/player/')}
                        style={{
                            background: '#1db954',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        {currentPlayback?.is_playing ? '⏸ 일시정지' : '▶ 재생'}
                    </button>
                    <button
                        onClick={() => handlePlayControl('next')}
                        disabled={loading?.includes('/player/')}
                        style={{
                            background: '#333',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        ⏭ 다음
                    </button>
                </div>
            </div>

            {/* 플레이리스트 */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>플레이리스트</h3>
                <button
                    onClick={handleGetPlaylists}
                    disabled={loading === '/playlists'}
                    style={{
                        background: '#1db954',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginBottom: '15px'
                    }}
                >
                    {loading === '/playlists' ? '조회 중...' : '플레이리스트 조회'}
                </button>

                {playlists && (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {playlists.items?.length > 0 ? (
                            <div style={{ display: 'grid', gap: '10px' }}>
                                {playlists.items.slice(0, 10).map((playlist: any, index: number) => (
                                    <div key={index} style={{
                                        padding: '10px',
                                        border: '1px solid #eee',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        {playlist.images?.[0] && (
                                            <img
                                                src={playlist.images[0].url}
                                                alt={playlist.name}
                                                style={{ width: '40px', height: '40px', borderRadius: '4px' }}
                                            />
                                        )}
                                        <div>
                                            <h5 style={{ margin: '0 0 5px 0' }}>{playlist.name}</h5>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                                                {playlist.tracks?.total}곡 • {playlist.owner?.display_name}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#666' }}>플레이리스트가 없습니다</p>
                        )}
                    </div>
                )}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <a
                    href="/spotify-test"
                    style={{
                        color: '#1db954',
                        textDecoration: 'none',
                        fontSize: '14px'
                    }}
                >
                    ← Spotify 테스트 페이지로 돌아가기
                </a>
            </div>
        </div>
    );
};

export default SpotifyTestDashboard;
