import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getLearnedSongDetailAPI, type LearnedSongDetail } from '@/services/mypage'
import { AxiosError } from 'axios'

export default function LearnedSongDetailPage() {
  const { learnedSongId } = useParams<{ learnedSongId: string }>()
  const navigate = useNavigate()
  const [songDetail, setSongDetail] = useState<LearnedSongDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!learnedSongId) {
      navigate('/mypage')
      return
    }
    loadSongDetail(parseInt(learnedSongId))
  }, [learnedSongId, navigate])

  const loadSongDetail = async (id: number) => {
    try {
      setLoading(true)
      setError(null)

      const response = await getLearnedSongDetailAPI(id)
      setSongDetail(response.data.data)
    } catch (err: any) {
      console.error('학습한 곡 상세 정보 조회 실패:', err)

      if (err instanceof AxiosError) {
        const status = err.response?.status
        const message = err.response?.data?.message || '학습한 곡 정보를 불러오는데 실패했습니다.'

        switch (status) {
          case 401:
            setError('인증이 만료되었습니다. 다시 로그인해주세요.')
            break
          case 403:
            setError('해당 노래에 대한 접근 권한이 없습니다.')
            break
          case 404:
            setError('해당 노래의 학습 기록을 찾을 수 없습니다.')
            break
          case 500:
            setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
            break
          default:
            setError(message)
        }
      } else {
        setError('네트워크 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">학습 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive mb-3">
              <span>⚠️</span>
              <p className="font-medium">오류가 발생했습니다</p>
            </div>
            <p className="text-sm mb-3">{error}</p>
            <div className="flex gap-2">
              <Button
                onClick={() => loadSongDetail(parseInt(learnedSongId!))}
                variant="outline"
                size="sm"
              >
                다시 시도
              </Button>
              <Button
                onClick={() => navigate('/mypage')}
                variant="outline"
                size="sm"
              >
                마이페이지로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!songDetail) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <p className="text-center text-muted-foreground">데이터를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const { songInfo, learnedContent } = songDetail

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* 헤더 */}
      <div className="mb-6">
        <Button
          onClick={() => navigate('/mypage')}
          variant="outline"
          size="sm"
          className="mb-4"
        >
          ← 마이페이지로 돌아가기
        </Button>
        <h1 className="text-3xl font-bold mb-2">학습한 곡 상세</h1>
      </div>

      {/* 곡 정보 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🎵</span>
            곡 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded bg-gray-200 flex items-center justify-center">
              {songInfo.albumImgUrl ? (
                <img
                  src={songInfo.albumImgUrl}
                  alt={songInfo.title}
                  className="w-full h-full rounded object-cover"
                />
              ) : (
                <span className="text-2xl">🎵</span>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-2xl font-bold">{songInfo.title}</h2>
                <p className="text-lg text-muted-foreground">{songInfo.artists}</p>
                <p className="text-sm text-muted-foreground">{songInfo.album}</p>
              </div>

              <div className="flex gap-2">
                <Badge className={getLevelColor(songInfo.level)}>
                  {songInfo.level}
                </Badge>
                <Badge variant="outline">
                  {Math.floor(songInfo.durationMs / 60000)}분 {Math.floor((songInfo.durationMs % 60000) / 1000)}초
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  학습일: {formatDate(songInfo.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 학습한 문장들 */}
      {learnedContent.sentences.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>💬</span>
              학습한 문장 ({learnedContent.sentences.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {learnedContent.sentences.map((sentence) => (
                <div key={sentence.sentencesId} className="p-4 border rounded-lg">
                  <div className="mb-2">
                    <p className="font-medium text-lg">{sentence.sentence}</p>
                    <p className="text-muted-foreground">{sentence.meaning}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getLevelColor(sentence.level)} variant="secondary">
                      {sentence.level}
                    </Badge>
                    {sentence.tags.split(',').map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 학습한 단어들 */}
      {learnedContent.words.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📝</span>
              학습한 단어 ({learnedContent.words.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learnedContent.words.map((word) => (
                <div key={word.wordId} className="p-4 border rounded-lg">
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{word.word}</span>
                      <span className="text-sm text-muted-foreground">{word.phonetic}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{word.pos}</p>
                    <p className="font-medium">{word.meaning}</p>
                    <p className="text-sm text-muted-foreground italic mt-1">{word.examples}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getLevelColor(word.level)} variant="secondary">
                      {word.level}
                    </Badge>
                    {word.tags.split(',').map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 학습한 표현들 */}
      {learnedContent.expressions.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>💡</span>
              학습한 표현 ({learnedContent.expressions.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {learnedContent.expressions.map((expression) => (
                <div key={expression.expressionId} className="p-4 border rounded-lg">
                  <div className="mb-2">
                    <p className="font-bold text-lg">{expression.expression}</p>
                    <p className="font-medium">{expression.meaning}</p>
                    <p className="text-sm text-muted-foreground">{expression.context}</p>
                    <p className="text-sm text-muted-foreground italic mt-1">{expression.examples}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getLevelColor(expression.level)} variant="secondary">
                      {expression.level}
                    </Badge>
                    {expression.tags.split(',').map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 학습한 관용어/숙어들 */}
      {learnedContent.idioms.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🎭</span>
              학습한 관용어/숙어 ({learnedContent.idioms.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {learnedContent.idioms.map((idiom) => (
                <div key={idiom.idiomId} className="p-4 border rounded-lg">
                  <div className="mb-2">
                    <p className="font-bold text-lg">{idiom.phrase}</p>
                    <p className="font-medium">{idiom.meaning}</p>
                    <p className="text-sm text-muted-foreground italic mt-1">{idiom.examples}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getLevelColor(idiom.level)} variant="secondary">
                      {idiom.level}
                    </Badge>
                    {idiom.tags.split(',').map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 가사 */}
      {songInfo.lyrics && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🎤</span>
              가사
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                {songInfo.lyrics}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}