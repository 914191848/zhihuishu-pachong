# 修改编号格式，便于排序：
# 1.1 --> 01.01
# 1.1.1 --> 01.01.01

import os
def format_version(version_str):
    parts = version_str.split(".")
    padded_parts = ["{:02d}".format(int(p)) for p in parts]
    return ".".join(padded_parts)


def rename_videos(directory):
    for filename in os.listdir(directory):
        if filename.endswith('.mp4'):
            # 提取原始文件名中的编号部分
            filename_ = filename.split(' ')[1]
                
            name_num = format_version(filename.split(' ')[0])
            new_name = name_num +' ' + filename_
            old_path = os.path.join(directory, filename)
            new_path = os.path.join(directory, new_name)
            os.rename(old_path, new_path)
            print(f'Renamed: {filename} -> {new_name}')

if __name__ == '__main__':
    directory = r'D:\360data\重要数据\桌面\新建文件夹\NHT-CFD实训'
    rename_videos(directory)
