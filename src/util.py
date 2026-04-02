import pandas as pd
import geopandas as gpd

def show_step(msg):
    print(f'[INFO] {msg}')

def validate_gdf_dict(gdf_dict):
    v_df= pd.read_csv('data/validation_table.csv', dtype='object', index_col='layer')

    invalid_list = []
    for key in gdf_dict:
        gdf= gdf_dict[key]
        test_shape = gdf_dict[key].shape
        v_shape = (int(v_df.loc[key]['records']), int(v_df.loc[key]['fields']))

        if v_shape != test_shape:
            #show_step(f'{key} did not pass validation.')
            invalid_list.append(key)
        else:
            #show_step(f'{key} passed validation.')
            pass
    
    if invalid_list == []:
        show_step('gdf_dict passed validation.')
        return True
    else:
        show_step(f'{invalid_list} did not pass validation.')
        return False
