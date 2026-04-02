import os

# import pandas as pd
# import geopandas as gpd

import src.constants as C
import src.data_io as io
import src.gis as gis
import src.util as util

def build_gdf(path=C.DATA_PATH):
    """
    Data pipeline function. Calls 3 UDFs.
    """
    df = io.read_attribute_data(path)
    gdf = gis.read_geometry_data(path)

    return gis.merge_disb_table_to_disb_geo(df, gdf)

gdf = build_gdf() # this GeoDataFrame is the simplified DB layer merged to all the attribute data

gdf_dict = gis.rollup(gdf, layers=['CMA']) # accepts the simplified DB layer and dissolves the number of layers specified into a dict of GeoDataFrames

for key in gdf_dict:
    util.show_step(f'{key}: {list(gdf_dict[key].columns)}')

gdf_dict = gis.remove_residual_areas(gdf_dict)

util.show_step(util.validate_gdf_dict(gdf_dict))

gis.gdf_dict_to_file(gdf_dict, format='shp')