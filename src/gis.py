import os

import geopandas as gpd

import src.constants as C
import src.util as util
import src.data_io as io

def read_geometry_data(path=C.DATA_PATH):
    file = os.path.join(path, 'PIC2021DB_202106_SIM.shp') # simplified DB boundary file
    gdf = gpd.read_file(
        file,
    ).rename(columns={
        'DBUID':'DBUID_IDIDU',
        'DGUID': 'DBDGUID_IDIDUGD'}
            )[['DBUID_IDIDU',
            'DBDGUID_IDIDUGD', 
            'geometry']].query(
        "DBUID_IDIDU not in ['12090981004', '59240260010', '13010103018', '12170389013', '24640228010', '10020079053']" # drop bad records
    )

    util.show_step(f'Read {gdf.shape} from {file}. CRS={gdf.crs}') # debugging 

    return gdf

def merge_disb_table_to_disb_geo(df, gdf):
    """
    Merge the attributes to the geometries on DBDGUID_IDIDUGD.
    """
    gdf = gdf[['DBDGUID_IDIDUGD', 'geometry']].merge(
        df,
        how='left',
        on='DBDGUID_IDIDUGD'
    )

    return gdf

def rollup(gdf, num=None, layers=None):
    """
    Dissolve the number of geographies specified and return a dictionary of GeoDataFrames.
    """
    if layers is not None:
        util.show_step(layers)
        keys=layers
        num = None
    
    if num is not None:
        keys = list(C.ALL_COL_DIC.keys())
        keys=keys[:num]

    if num is None and layers is None:
        keys = list(C.ALL_COL_DIC.keys())
    
    util.show_step(f'Dissolving layers {keys}')
    gdf_dict={}

    for key in keys:
        util.show_step(f'Fields for {key}: {C.ALL_COL_DIC[key]}') # debugging
        util.show_step(f'Dissolving by {C.ALL_COL_DIC[key][0]}...') # debugging
        new_gdf = gdf[C.ALL_COL_DIC[key]].dissolve(by=C.ALL_COL_DIC[key][0], as_index=False)
        gdf_dict[key]=new_gdf
    
    return gdf_dict


def gdf_dict_to_file(gdf_dict, format):
    """
    Write GeoDataFrame dict to file.
    """

    if format not in ['shp', 'gpkg', 'parquet', 'gdb']:
        util.show_step("Invalid format. Defaulting to 'Esri Shapefile'.")
        format='shp'
    
    try:
        if format=='shp':
            gdf_dict_to_shp(gdf_dict, C.OUTPUT_PATH)
        elif format=='gpkg':
            gdf_dict_to_gpkg(gdf_dict, C.OUTPUT_PATH)
        elif format=='parquet':
            gdf_dict_to_parquet(gdf_dict, C.OUTPUT_PATH)
        elif format=='gdb':
            gdf_dict_to_gdb(gdf_dict, C.OUTPUT_PATH)
        return True
    except Exception as e:
        util.show_step(f'Exception in gdf_dict_to_file: {e}')
    
        return False
    

def gdf_dict_to_gdb(gdf_dict, path=C.OUTPUT_PATH):
    """
    Accepts the GeoDataFrame dict, and writes to an EXISTING Esri GeoDatabase file.
    GeoPandas cannot create a .gdb, only write to it.
    """
    util.show_step('Writing to GDB...')

    file_name = 'SIM_l000b21f.gdb'
    fq_path = os.path.join(path, file_name)

    util.show_step(f'fq_path={fq_path}') # debugging

    for key in gdf_dict:
        layer_name = io.generate_file_name(key, 'gdb', None).split('.')[0]

        gdf_dict[key].to_file(file_name, layer=layer_name) # write to file

        util.show_step(f'layer_name={layer_name}') # debugging
    
    return fq_path


def gdf_dict_to_gpkg(gdf_dict, path=C.OUTPUT_PATH):
    """
    Accepts the GeoDataFrame dict, and writes one GeoPackage (OGC) file.
    """
    util.show_step('Writing to GPKG...')

    file_name = 'SIM_l000b21k.gpkg'
    fq_path = os.path.join(path, 'GPKG', file_name)

    util.show_step(f'fq_path={fq_path}') # debugging

    for key in gdf_dict:
        layer_name = io.generate_file_name(key, 'gpkg', None).split('.')[0]

        gdf_dict[key].to_file(fq_path, layer=layer_name, index=False) # write to file

        util.show_step(f'layer_name={layer_name}') # debugging
        
    return fq_path


def gdf_dict_to_shp(gdf_dict, path=C.OUTPUT_PATH):
    """
    Accepts the GeoDataFrame dict, and writes to a directory in Esri Shapefile format.
    note: Two shapefiles are produced for each GeoDataFrame, one is _e, one is _f.
    """
    util.show_step('Writing to SHP...')

    format = 'shp'
    path = os.path.join(path, 'SHP')

    util.show_step('Renaming columns for Shapefile compatibility.')

    for language in 'ef':
        for key in gdf_dict:
            file_name = io.generate_file_name(key, format, language)
            fq_path = os.path.join(path, file_name)
            if language == 'e':
                gdf = gdf_dict[key].copy()
                util.show_step(gdf.columns)
                gdf.columns = [
                    col.split('_')[0] if '_' in col else col
                    for col in gdf.columns
                    ]
                util.show_step(gdf.columns)
            if language == 'f':
                gdf = gdf_dict[key].copy()
                util.show_step("renaming french columns")
                util.show_step(gdf.columns)
                gdf.columns = [
                    col.split('_')[1] if '_' in col else col
                    for col in gdf.columns
                    ]
                util.show_step(gdf.columns)

            util.show_step(f'Writing {file_name} to {fq_path}.')
            gdf.to_file(fq_path, index=False) # write to file

            #util.show_step(f'fq_path={fq_path}') # debugging 

    return path

def gdf_dict_to_parquet(gdf_dict, path):
    """
    Accepts the gdf_dict and path, are writes it to a directory in parquet format.
    """
    util.show_step('Writing to PARQUET...')

    path = os.path.join(path, 'PARQUET')
    util.show_step(f'path={path}')

    for key in gdf_dict:
        file_name= io.generate_file_name(key, 'parquet', None)
        fq_path= os.path.join(path, file_name)
        
        gdf_dict[key].to_parquet(fq_path, index=False)

        util.show_step(f'fq_path={fq_path}') #debugging
    
    return path

def remove_residual_areas(gdf_dict):
    """
    Accepts a GeoDataFrame, and removes the residual areas from it.
    note: this only needs to be used for CT, CMA, and POPCTRRA
    """
    keys = list(gdf_dict.keys())
    for key in keys:
        gdf = gdf_dict[key].copy()
        if key == 'CMA':
            util.show_step(f'{key}:{gdf.shape}')
            gdf = gdf[~gdf['CMAUID_RMRIDU'].str.startswith('99')]
            gdf = gdf[~gdf['CMAUID_RMRIDU'].str.startswith('000')]
            util.show_step(f'{key}:{gdf.shape}')
        elif key == 'POPCTRRA':
            util.show_step(f'{key}:{gdf.shape}')
            gdf = gdf[~gdf['POPCTRRACLASS_CTRPOPRRCLASSE'].str.startswith('1')]
            util.show_step(f'{key}:{gdf.shape}')
        elif key== 'CT':
            util.show_step(f'{key}:{gdf.shape}')
            gdf = gdf[~gdf['CTUID_SRIDU'].str.startswith('99')]
            util.show_step(f'{key}:{gdf.shape}')
        gdf_dict[key] = gdf

    return gdf_dict