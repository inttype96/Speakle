from app.core.weaviateClient import get_client
import pandas as pd
from weaviate.classes.query import Filter
import numpy as np

def debug_vector_structure():
    """벡터 구조 디버깅 - dict 타입 안전 처리"""
    client = get_client()
    try:
        lyric_col = client.collections.get("LyricChunk")
        
        print("===== 🔍 벡터 구조 디버깅 =====")
        objs = lyric_col.query.fetch_objects(limit=3, include_vector=True)
        
        for i, o in enumerate(objs.objects):
            props = o.properties
            print(f"\n--- Object {i+1} ---")
            print(f"Vector type: {type(o.vector)}")
            print(f"Vector is None: {o.vector is None}")
            
            if o.vector is not None:
                print(f"Vector length: {len(o.vector)}")
                
                # dict인 경우 키들 확인
                if isinstance(o.vector, dict):
                    print(f"Vector keys: {list(o.vector.keys())}")
                    print(f"Vector values sample: {list(o.vector.values())[:5] if o.vector.values() else 'No values'}")
                    
                    # 첫 번째 키-값 확인
                    if o.vector:
                        first_key = list(o.vector.keys())[0]
                        first_value = o.vector[first_key]
                        print(f"First key: {first_key} (type: {type(first_key)})")
                        print(f"First value: {first_value} (type: {type(first_value)})")
                        
                        # 값이 리스트인지 확인
                        if isinstance(first_value, (list, tuple, np.ndarray)):
                            print(f"First value length: {len(first_value)}")
                            if len(first_value) > 0:
                                print(f"First value elements sample: {first_value[:5]}")
                
                # list나 array인 경우
                elif hasattr(o.vector, '__getitem__') and not isinstance(o.vector, str):
                    try:
                        print(f"First 5 elements: {o.vector[:5]}")
                        print(f"Element type: {type(o.vector[0]) if len(o.vector) > 0 else 'N/A'}")
                    except Exception as e:
                        print(f"Error accessing vector elements: {e}")
                
                if hasattr(o.vector, 'shape'):
                    print(f"Vector shape: {o.vector.shape}")
            
            print(f"Words: {props.get('words', '')[:50]}")
    
    finally:
        client.close()

def check_ingestion_data_format():
    """ingestion 할 때의 데이터 형태 확인"""
    print("===== Ingestion 데이터 형태 확인 =====")
    
    # 원본 parquet 파일에서 벡터 데이터 확인
    try:
        df_sample = pd.read_parquet("data/song_embeddings_with_timestamps_01.parquet")
        print(f"Parquet file columns: {df_sample.columns.tolist()}")
        
        # 벡터 컬럼들 확인
        vector_cols = [col for col in df_sample.columns if col.startswith('vector_')]
        print(f"Vector columns count: {len(vector_cols)}")
        print(f"Sample vector columns: {vector_cols[:10]}")
        
        if vector_cols:
            # 한 행의 벡터 데이터 확인
            sample_row = df_sample.iloc[0]
            vector_data = sample_row.loc[vector_cols].to_numpy(dtype=float)
            print(f"Vector shape: {vector_data.shape}")
            print(f"Vector sample: {vector_data[:5]}")
            print(f"Vector as list length: {len(vector_data.tolist())}")
            
    except Exception as e:
        print(f"Error reading parquet: {e}")

def test_word_similarity_fixed(query_word="yours", n=5):
    """수정된 유사도 검색 - dict 타입 처리"""
    client = get_client()
    try:
        lyric_col = client.collections.get("LyricChunk")

        print(f"===== '{query_word}' 단어 기반 추천 확인 (수정됨) =====")
        
        # 1단계: 해당 단어가 포함된 청크 찾기
        objs = lyric_col.query.fetch_objects(
            filters=Filter.by_property("words").like(f"*{query_word}*"),
            limit=100,
            include_vector=True
        )
        
        print(f"'{query_word}' 포함 청크 총 개수: {len(objs.objects)}")
        
        # 2단계: 벡터 유효성 검사 (dict 처리)
        valid_objs = []
        for o in objs.objects:
            if o.vector is not None:
                try:
                    # dict인 경우 값들을 리스트로 변환 시도
                    if isinstance(o.vector, dict):
                        # 키가 하나이고 그 값이 실제 벡터 리스트인지 확인
                        if len(o.vector) == 1:
                            first_value = list(o.vector.values())[0]
                            if isinstance(first_value, (list, tuple, np.ndarray)) and len(first_value) >= 1000:
                                valid_objs.append(o)
                        # 또는 숫자 키들로 구성된 딕셔너리인지 확인
                        else:
                            numeric_keys = [k for k in o.vector.keys() if str(k).replace('.','').replace('-','').isdigit()]
                            if len(numeric_keys) >= 1000:
                                valid_objs.append(o)
                    elif hasattr(o.vector, '__len__'):
                        vector_len = len(o.vector)
                        if vector_len >= 1000:
                            valid_objs.append(o)
                except Exception as e:
                    print(f"벡터 처리 오류: {e}")
                    continue
        
        print(f"유효한 벡터를 가진 청크 개수: {len(valid_objs)}")
        
        if not valid_objs:
            print("벡터가 있는 청크를 찾지 못했습니다.")
            # 벡터 구조 상세 확인
            if objs.objects:
                sample_obj = objs.objects[0]
                print(f"샘플 벡터 타입: {type(sample_obj.vector)}")
                if isinstance(sample_obj.vector, dict):
                    print(f"벡터 딕셔너리 키 개수: {len(sample_obj.vector)}")
                    print(f"벡터 딕셔너리 키: {list(sample_obj.vector.keys())}")
                    if sample_obj.vector:
                        first_key = list(sample_obj.vector.keys())[0]
                        first_value = sample_obj.vector[first_key]
                        print(f"첫 번째 값 타입: {type(first_value)}")
                        print(f"첫 번째 값 길이: {len(first_value) if hasattr(first_value, '__len__') else 'N/A'}")
            
            # 대신 텍스트만 보여주기
            print("텍스트 기반 샘플:")
            for o in objs.objects[:10]:
                props = o.properties
                print({
                    "song_id": props.get("song_id"),
                    "chunk_idx": props.get("chunk_idx"),
                    "words": (props.get("words") or "")[:80],
                    "vector_type": type(o.vector).__name__
                })
            return
        
        # 3단계: 벡터 유사도 검색 실행
        query_obj = valid_objs[0]
        query_text = query_obj.properties.get("words", "")
        
        print(f"기준 가사: {query_text[:80]}...")
        
        try:
            # dict 벡터를 리스트로 변환
            if isinstance(query_obj.vector, dict):
                if len(query_obj.vector) == 1:
                    # 하나의 키에 전체 벡터가 들어있는 경우
                    vector = list(query_obj.vector.values())[0]
                else:
                    # 숫자 키로 정렬하여 순서대로 벡터 복원
                    keys = sorted([k for k in query_obj.vector.keys() if str(k).replace('.','').replace('-','').isdigit()], 
                                key=lambda x: float(x))
                    vector = [query_obj.vector[k] for k in keys]
                print(f"벡터 차원: {len(vector)}")
            else:
                vector = list(query_obj.vector)
                print(f"벡터 차원: {len(vector)}")
            
            res = lyric_col.query.near_vector(vector, limit=n)
            
            print(f"\n'{query_word}' 유사한 가사 청크 추천 결과:")
            for i, o in enumerate(res.objects):
                props = o.properties
                print(f"{i+1}. {props.get('words', '')[:80]}")
                print(f"   Song ID: {props.get('song_id')}")
                
        except Exception as e:
            print(f" 벡터 검색 실패: {str(e)}")

    finally:
        client.close()

def count_vectors_with_embeddings_fixed(sample_size=100):
    """수정된 벡터 카운팅"""
    client = get_client()
    try:
        lyric_col = client.collections.get("LyricChunk")

        objs = lyric_col.query.fetch_objects(limit=sample_size, include_vector=True)

        # 벡터 통계
        vector_stats = {
            "total": 0,
            "has_vector": 0,
            "dict_vectors": 0,
            "list_vectors": 0,
            "valid_dimension": 0,
            "dimension_1": 0,
            "dimensions": [],
            "dict_structures": {}  # dict 구조 분석
        }
        
        for o in objs.objects:
            vector_stats["total"] += 1
            
            if o.vector is not None:
                vector_stats["has_vector"] += 1
                
                # dict 타입 벡터 처리
                if isinstance(o.vector, dict):
                    vector_stats["dict_vectors"] += 1
                    key_count = len(o.vector)
                    
                    # dict 구조 분석
                    if key_count == 1:
                        # 하나의 키에 전체 벡터가 들어있는 경우
                        first_key = list(o.vector.keys())[0]
                        first_value = o.vector[first_key]
                        if isinstance(first_value, (list, tuple, np.ndarray)):
                            actual_dim = len(first_value)
                            structure_key = f"single_key_list_{actual_dim}"
                        else:
                            actual_dim = 1
                            structure_key = f"single_key_scalar"
                    else:
                        # 여러 키로 구성된 경우
                        actual_dim = key_count
                        structure_key = f"multi_key_{key_count}"
                    
                    vector_stats["dict_structures"][structure_key] = vector_stats["dict_structures"].get(structure_key, 0) + 1
                    
                    if actual_dim == 1:
                        vector_stats["dimension_1"] += 1
                    elif actual_dim >= 1000:
                        vector_stats["valid_dimension"] += 1
                        
                    vector_stats["dimensions"].append(actual_dim)
                
                # 리스트나 다른 타입
                else:
                    vector_stats["list_vectors"] += 1
                    try:
                        dim = len(o.vector) if hasattr(o.vector, '__len__') else 0
                        vector_stats["dimensions"].append(dim)
                        
                        if dim == 1:
                            vector_stats["dimension_1"] += 1
                        elif dim >= 1000:
                            vector_stats["valid_dimension"] += 1
                            
                    except:
                        vector_stats["dimensions"].append(0)

        print("=====  수정된 Vector EDA =====")
        print(f"총 샘플: {vector_stats['total']:,}")
        print(f"벡터 있음: {vector_stats['has_vector']:,}")
        print(f"Dict 타입 벡터: {vector_stats['dict_vectors']:,}")
        print(f"List 타입 벡터: {vector_stats['list_vectors']:,}")
        print(f"차원=1인 것: {vector_stats['dimension_1']:,}")
        print(f"유효 차원(>=1000): {vector_stats['valid_dimension']:,}")
        
        print("\nDict 구조 분석:")
        for structure, count in vector_stats['dict_structures'].items():
            print(f"  {structure}: {count}")
        
        if vector_stats['dimensions']:
            unique_dims = sorted(list(set(vector_stats['dimensions'])))
            print(f"발견된 차원들: {unique_dims[:20]}")
            print(f"최대 차원: {max(vector_stats['dimensions'])}")
            print(f"최소 차원: {min(vector_stats['dimensions'])}")

    finally:
        client.close()

if __name__ == "__main__":
    print("=====  새로운 디버깅 시작 =====")
    debug_vector_structure()
    check_ingestion_data_format()
    test_word_similarity_fixed("menu", n=5)
    count_vectors_with_embeddings_fixed(sample_size=100)