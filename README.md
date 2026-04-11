# ubiquitous-chainsaw
This is a GET endpoint at /api/classify that takes a name query parameter and calls the Genderize API. The raw API response is not what gets returned. It is processed first. In this, I rename count to sample_size, compute is_confident: true when probability >= 0.7 AND sample_size >= 100 and generates processed_at on every request. UTC, ISO 8601
