import { useState, useEffect } from 'react'

function SpotifyTest() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loginLoading, setLoginLoading] = useState(false)
    const [response] = useState<any>(null)
    const [error] = useState<string | null>(null)
    const [loginError, setLoginError] = useState<string | null>(null)
    const [loginForm, setLoginForm] = useState({ email: '', password: '' })

    // localStorage에서 토큰 확인해서 로그인 상태 복원
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token && token !== 'null' && token !== 'undefined') {
            setIsLoggedIn(true);
            console.log('저장된 토큰으로 로그인 상태 복원:', token.substring(0, 20) + '...');
        }
    }, []);

    const handleLogin = async () => {
        if (!loginForm.email || !loginForm.password) {
            setLoginError('이메일과 비밀번호를 입력해주세요.')
            return
        }

        setLoginLoading(true)
        setLoginError(null)

        try {
            const result = await fetch('https://j13c104.p.ssafy.io/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: loginForm.email,
                    password: loginForm.password
                })
            })

            const data = await result.json()

            console.log('로그인 응답 전체:', JSON.stringify(data, null, 2));
            console.log('data.accessToken:', data.accessToken);
            console.log('data.access_token:', data.access_token);
            console.log('data.token:', data.token);

            if (result.ok) {
                setIsLoggedIn(true)
                setLoginForm({ email: '', password: '' })

                // 여러 가능한 토큰 필드명 확인
                const token = data.accessToken || data.access_token || data.token || data.jwt;
                console.log('추출된 토큰:', token);

                if (token && token !== 'null' && token !== 'undefined') {
                    localStorage.setItem('authToken', token);
                    console.log('JWT 토큰 localStorage에 저장됨:', token.substring(0, 20) + '...')

                    // 저장 후 바로 확인
                    const savedToken = localStorage.getItem('authToken');
                    console.log('저장 후 확인:', savedToken ? savedToken.substring(0, 20) + '...' : 'null');
                } else {
                    console.log('응답에 유효한 토큰이 없습니다.')
                    localStorage.removeItem('authToken');
                }
            } else {
                setLoginError(`로그인 실패: ${data.message || 'Unknown error'}`)
            }
        } catch (err) {
            setLoginError(`네트워크 에러: ${err instanceof Error ? err.message : 'Unknown error'}`)
        } finally {
            setLoginLoading(false)
        }
    }

    const handleSpotifyConnect = async () => {
        if (!isLoggedIn) {
            alert('먼저 로그인해주세요!')
            return
        }

        const token = localStorage.getItem('authToken');
        console.log('Spotify 연결 시도 - 토큰:', token ? `${token.substring(0, 20)}...` : 'null')

        setLoading(true)

        try {
            const headers: HeadersInit = {}

            if (token && token !== 'null' && token !== 'undefined') {
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
        setIsLoggedIn(false);
        localStorage.removeItem('authToken');
        console.log('로그아웃: 토큰이 localStorage에서 제거됨');
    }

    // 현재 토큰 상태 표시
    const currentToken = localStorage.getItem('authToken');

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
                <h2>1. 로그인</h2>
                <p>Status: {isLoggedIn ? '✅ 로그인됨' : '❌ 로그인 필요'}</p>

                {!isLoggedIn && (
                    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#f9f9f9' }}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>이메일:</label>
                            <input
                                type="email"
                                value={loginForm.email}
                                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                placeholder="이메일을 입력하세요"
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>비밀번호:</label>
                            <input
                                type="password"
                                value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                placeholder="비밀번호를 입력하세요"
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        {loginError && (
                            <div style={{
                                backgroundColor: '#ffebee',
                                color: '#d32f2f',
                                padding: '10px',
                                borderRadius: '4px',
                                marginBottom: '15px',
                                fontSize: '14px'
                            }}>
                                {loginError}
                            </div>
                        )}
                        <button
                            onClick={handleLogin}
                            disabled={loginLoading}
                            style={{
                                padding: '10px 20px',
                                fontSize: '16px',
                                backgroundColor: loginLoading ? '#ccc' : '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: loginLoading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loginLoading ? '로그인 중...' : '로그인'}
                        </button>
                    </div>
                )}

                {isLoggedIn && (
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
                )}
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

            {error && (
                <div style={{
                    backgroundColor: '#ffebee',
                    border: '1px solid #f44336',
                    borderRadius: '4px',
                    padding: '15px',
                    marginBottom: '20px'
                }}>
                    <h3 style={{ color: '#f44336', margin: '0 0 10px 0' }}>에러 발생</h3>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{error}</pre>
                </div>
            )}

            {response && (
                <div style={{
                    backgroundColor: '#e8f5e8',
                    border: '1px solid #4caf50',
                    borderRadius: '4px',
                    padding: '15px'
                }}>
                    <h3 style={{ color: '#2e7d32', margin: '0 0 10px 0' }}>응답 성공</h3>
                    <pre style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        backgroundColor: '#f5f5f5',
                        padding: '10px',
                        borderRadius: '4px',
                        overflow: 'auto'
                    }}>
                        {JSON.stringify(response, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    )
}

export default SpotifyTest