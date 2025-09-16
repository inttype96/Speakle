import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, isAuthenticated, getAccessToken } from '@/store/auth'

function SpotifyTest() {
    const navigate = useNavigate()
    const logout = useAuthStore((state) => state.logout)
    const [loading, setLoading] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    // 기존 인증 상태 확인
    useEffect(() => {
        const authenticated = isAuthenticated()
        setIsLoggedIn(authenticated)

        // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
        if (!authenticated) {
            navigate('/login?redirect=/spotify-test')
        }
    }, [navigate])

    const handleSpotifyConnect = async () => {
        if (!isLoggedIn) {
            navigate('/login?redirect=/spotify-test')
            return
        }

        const token = getAccessToken()
        console.log('Spotify 연결 시도 - 토큰:', token ? `${token.substring(0, 20)}...` : 'null')

        setLoading(true)

        try {
            const headers: HeadersInit = {}

            if (token) {
                headers['Authorization'] = `Bearer ${token}`
                console.log('Authorization 헤더 추가됨')
            } else {
                console.warn('유효한 토큰이 없습니다.')
            }

            const result = await fetch('https://j13c104.p.ssafy.io/api/spotify/connect', {
                method: 'GET',
                headers,
                credentials: 'include'
            })

            console.log('응답 상태:', result.status, result.statusText)

            if (result.ok) {
                const data = await result.json()
                if (data.redirectUrl) {
                    window.location.href = data.redirectUrl
                } else {
                    alert('리다이렉트 URL을 받지 못했습니다.')
                }
            } else {
                const errorData = await result.json()
                alert(`Spotify 연결 실패: ${errorData.message || 'Unknown error'}`)
            }
        } catch (err) {
            alert(`네트워크 에러: ${err instanceof Error ? err.message : 'Unknown error'}`)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        logout()
        setIsLoggedIn(false)
        navigate('/login')
    }

    // 현재 토큰 상태 표시
    const currentToken = getAccessToken()

    // 로그인되지 않은 경우 로딩 화면 표시 (리다이렉트 중)
    if (!isLoggedIn) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px'
            }}>
                로그인이 필요합니다. 로그인 페이지로 이동 중...
            </div>
        )
    }

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Spotify API 테스트 페이지</h1>

            {/* 토큰 상태 디버깅 */}
            <div style={{
                background: '#f0f0f0',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '20px',
                fontSize: '12px',
                fontFamily: 'monospace'
            }}>
                <strong>토큰 상태:</strong> {currentToken ? `${currentToken.substring(0, 30)}...` : 'null'}
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h2>1. 로그인 상태</h2>
                <p>Status: ✅ 로그인됨</p>

                <div style={{ marginBottom: '15px' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '10px'
                        }}
                    >
                        로그아웃
                    </button>
                    <a
                        href="/spotify-dashboard"
                        style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            backgroundColor: '#1db954',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            display: 'inline-block'
                        }}
                    >
                        🎵 Spotify 대시보드
                    </a>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h2>2. Spotify 연동 테스트</h2>

                <button
                    onClick={handleSpotifyConnect}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        backgroundColor: loading ? '#ccc' : '#1db954',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? '요청 중...' : '/api/spotify/connect 호출'}
                </button>
            </div>

            <div style={{
                backgroundColor: '#e3f2fd',
                border: '1px solid #2196f3',
                borderRadius: '4px',
                padding: '15px',
                marginTop: '20px'
            }}>
                <h3 style={{ color: '#1976d2', margin: '0 0 10px 0' }}>안내</h3>
                <p style={{ margin: 0, fontSize: '14px' }}>
                    이 페이지는 기존 로그인 시스템과 통합되어 있습니다.
                    메인 페이지에서 로그인하면 여기서도 자동으로 인증됩니다.
                </p>
            </div>
        </div>
    )
}

export default SpotifyTest