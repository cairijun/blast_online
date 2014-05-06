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
