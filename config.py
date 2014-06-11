CELERY_BROKER = 'redis://'

BLAST_DEFAULT_KWARGS = {
    'blastn': {
        '-task': 'blastn',
        '-gapopen': '5',
        '-gapextend': '2',
        '-penalty': '-3',
        '-reward': '1',
    },
    'blastp': {
        '-task': 'blastp',
        '-gapopen': '5',
        '-gapextend': '2',
        '-matrix': 'BLOSUM62',
    },
    'blastx': {
        '-gapopen': '5',
        '-gapextend': '2',
        '-matrix': 'BLOSUM62',
    },
    'tblastn': {
        '-gapopen': '5',
        '-gapextend': '2',
        '-matrix': 'BLOSUM62',
    },
    'tblastx': {
        '-gapopen': '5',
        '-gapextend': '2',
        '-matrix': 'BLOSUM62',
    },
}
BLAST_DB_DIR = './blast_db'
BLAST_INPUT_DIR = './tmp/input'
BLAST_OUTPUT_DIR = './tmp/output'

POLL_STATUS_RETRIES = 50

STATS_COUNT_UPDATE_SCRIPT = """
local total = redis.call('incr', 'stats_count:total')

local today = redis.call('incr', 'stats_count:today')
local peek = redis.call('get', 'stats_count:peek')
if peek == false then
    peek = 0
end
if today > tonumber(peek) then
    redis.call('set', 'stats_count:peek', today)
    peek = today
end

local tomorrow = math.ceil(tonumber(KEYS[1]) / 86400) * 86400
redis.call('expireat', 'stats_count:today', tomorrow)

return {total, today, peek}
"""
