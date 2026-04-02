import os

import pandas as pd

import src.constants as C
from src import util


def read_attribute_data(path=C.DATA_PATH): # this should be a loop!!!
    """
    Read attribute data, clean it, and merge it into one DataFrame
    """
    data_file_list = os.listdir(path)

    df = pd.read_csv(
        os.path.join(path, '2021_92-151_X.csv'), # geographic attribute file
        encoding=C._ENCODING,
        usecols=C.GAF_COLS,
        dtype='object',
    )

    df = df.merge(pd.read_csv(
        os.path.join(path, 'lda_000b21a_e_wCAR21UID.csv'), # DA to CAR correspondence
        header = 0,
        names = ['DAUID_ADIDU', 'CARUID_RARIDU', 'CARDGUID_RARIDUGD', 'CARENAME_RARANOM', 'CARFNAME_RARFNOM'],
        encoding=C._ENCODING,
        dtype='object'),
        how='left',
        on='DAUID_ADIDU'
        )

    df = df.merge(pd.read_csv(
        os.path.join(path, 'COMPREHENSIVE_HR2024_21.csv'), # DB to HR correspondence
        header = 0,
        names = ['DBUID_IDIDU', 'CSDUID_SDRIDU', 'HRUID2024_RSIDU2024', 'HRENAME_RSANOM', 'HRFNAME_RSFNOM', 'DBPOP'],
        usecols = ['DBUID_IDIDU', 'HRUID2024_RSIDU2024', 'HRENAME_RSANOM', 'HRFNAME_RSFNOM'],
        encoding=C._ENCODING,
        dtype='object'),
        how='left',
        on='DBUID_IDIDU'
    )

    df = df.merge(pd.read_csv(
        os.path.join(path, 'BCHSDA_HR2024_21.csv'), # DB to BCHSDA correspondence
        header = 0,
        names = ['DBUID_IDIDU', 'CSDUID_SDRIDU', 'BCHSDAUID2024_ZPSSCBIDU2024', 'BCHSDAENAME_ZPSSCBANOM', 'BCHSDAFNAME_ZPSSCBFNOM', 'DBPOP2021'],
        usecols = ['DBUID_IDIDU', 'BCHSDAUID2024_ZPSSCBIDU2024', 'BCHSDAENAME_ZPSSCBANOM', 'BCHSDAFNAME_ZPSSCBFNOM'],
        encoding=C._ENCODING,
        dtype='object'),
        how='left',
        on='DBUID_IDIDU'
    )

    df = df.merge(pd.read_csv(
        os.path.join(path, 'OHR_HR2024_21.csv'), # DB to OHR correspondence
        header = 0,
        names = ['DBUID_IDIDU', 'CSDUID_SDRIDU', 'OHRUID2024_RSOIDU2024', 'OHRENAME_RSOANOM', 'OHRFNAME_RSOFNOM', 'DBPOP2021'],
        usecols = ['DBUID_IDIDU', 'OHRUID2024_RSOIDU2024', 'OHRENAME_RSOANOM', 'OHRFNAME_RSOFNOM'],
        encoding=C._ENCODING,
        dtype='object'),
        how='left',
        on='DBUID_IDIDU'
    )

    util.show_step(f'Read {df.shape} from {path}.') # debugging

    return df

def generate_file_name(layer, format, language=None):
    """
    Takes 3 args and returns the qualified file name
    """
    if layer not in [key for key in C.ALL_COL_DIC]:
        raise Exception(f'! {layer} not in {[C.ALL_COL_DIC.keys()]}')
    if format not in ['shp', 'gdb', 'gpkg', 'parquet']:
        raise Exception(f'! {format} not in {['shp', 'gdb', 'gpkg', 'parquet']}')
    if language not in ['e', 'f', None]:
        raise Exception(f'{language} not in {['e', 'f', None]}')

    language_dict = {
        'e': '_e',
        'f': '_f',
        None: ''
    }

    format_dict = {
        'shp': 'a',
        'gdb': 'f',
        'gpkg': 'k',
        'parquet': 'p'
    }

    if len(layer) == 2:
        layer += '_'
    file_name = f'SIM_l{layer.lower()}000b21{format_dict[format]}{language_dict[language]}.{format}'

    return file_name

