import React, { useState } from 'react';
import settings from 'electron-settings';
import { ButtonToolbar } from 'rsuite';
import { useQuery, useQueryClient } from 'react-query';
import { useHistory } from 'react-router';
import GridViewType from '../viewtypes/GridViewType';
import ListViewType from '../viewtypes/ListViewType';
import useSearchQuery from '../../hooks/useSearchQuery';
import GenericPageHeader from '../layout/GenericPageHeader';
import GenericPage from '../layout/GenericPage';
import { getAlbumsDirect, getAllAlbums } from '../../api/api';
import PageLoader from '../loader/PageLoader';
import { useAppDispatch } from '../../redux/hooks';
import {
  toggleSelected,
  setRangeSelected,
  toggleRangeSelected,
  clearSelected,
} from '../../redux/multiSelectSlice';
import { StyledInputPicker } from '../shared/styled';
import { RefreshButton } from '../shared/ToolbarButtons';

const ALBUM_SORT_TYPES = [
  { label: 'A-Z (Name)', value: 'alphabeticalByName' },
  { label: 'A-Z (Artist)', value: 'alphabeticalByArtist' },
  { label: 'Most Played', value: 'frequent' },
  { label: 'Newly Added', value: 'newest' },
  { label: 'Random', value: 'random' },
  { label: 'Recently Played', value: 'recent' },
];

const AlbumList = () => {
  const dispatch = useAppDispatch();
  const history = useHistory();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('random');
  const [offset, setOffset] = useState(0);
  const [viewType, setViewType] = useState(settings.getSync('albumViewType'));
  const { isLoading, isError, data: albums, error }: any = useQuery(
    ['albumList', offset, sortBy],
    () =>
      sortBy === 'random'
        ? getAlbumsDirect({ type: 'random', size: settings.getSync('gridCardSize') })
        : getAllAlbums(offset, sortBy),
    {
      refetchOnWindowFocus: false,
      cacheTime: 3600000, // Stay in cache for 1 hour
      staleTime: Infinity, // Only allow manual refresh
    }
  );
  const [searchQuery, setSearchQuery] = useState('');
  const filteredData = useSearchQuery(searchQuery, albums, ['name', 'artist', 'genre', 'year']);

  let timeout: any = null;
  const handleRowClick = (e: any, rowData: any) => {
    if (timeout === null) {
      timeout = window.setTimeout(() => {
        timeout = null;

        if (e.ctrlKey) {
          dispatch(toggleSelected(rowData));
        } else if (e.shiftKey) {
          dispatch(setRangeSelected(rowData));
          dispatch(toggleRangeSelected(searchQuery !== '' ? filteredData : albums));
        }
      }, 100);
    }
  };

  const handleRowDoubleClick = (rowData: any) => {
    window.clearTimeout(timeout);
    timeout = null;

    dispatch(clearSelected());
    history.push(`/library/album/${rowData.id}`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.refetchQueries(['albumList'], { active: true });
    setIsRefreshing(false);
  };

  return (
    <GenericPage
      header={
        <GenericPageHeader
          title="Albums"
          subtitle={
            <ButtonToolbar>
              <RefreshButton onClick={handleRefresh} size="sm" loading={isRefreshing} width={100} />
            </ButtonToolbar>
          }
          subsidetitle={
            <StyledInputPicker
              width={140}
              defaultValue={sortBy}
              data={ALBUM_SORT_TYPES}
              cleanable={false}
              placeholder="Sort Type"
              onChange={async (value: string) => {
                await queryClient.cancelQueries(['albumList', offset, sortBy]);
                setSearchQuery('');
                setOffset(0);
                setSortBy(value);
              }}
            />
          }
          searchQuery={searchQuery}
          handleSearch={(e: any) => setSearchQuery(e)}
          clearSearchQuery={() => setSearchQuery('')}
          showViewTypeButtons
          viewTypeSetting="album"
          showSearchBar
          handleListClick={() => setViewType('list')}
          handleGridClick={() => setViewType('grid')}
        />
      }
    >
      {isLoading && <PageLoader />}
      {isError && <div>Error: {error}</div>}
      {!isLoading && !isError && viewType === 'list' && (
        <ListViewType
          data={searchQuery !== '' ? filteredData : albums}
          tableColumns={settings.getSync('albumListColumns')}
          rowHeight={Number(settings.getSync('albumListRowHeight'))}
          fontSize={settings.getSync('albumListFontSize')}
          handleRowClick={handleRowClick}
          handleRowDoubleClick={handleRowDoubleClick}
          cacheImages={{
            enabled: settings.getSync('cacheImages'),
            cacheType: 'album',
            cacheIdProperty: 'albumId',
          }}
          listType="album"
          virtualized
          disabledContextMenuOptions={['moveSelectedTo', 'removeFromCurrent', 'deletePlaylist']}
        />
      )}

      {!isLoading && !isError && viewType === 'grid' && (
        <GridViewType
          data={searchQuery !== '' ? filteredData : albums}
          cardTitle={{
            prefix: '/library/album',
            property: 'name',
            urlProperty: 'albumId',
          }}
          cardSubtitle={{
            prefix: 'artist',
            property: 'artist',
            urlProperty: 'artistId',
            unit: '',
          }}
          playClick={{ type: 'album', idProperty: 'id' }}
          size={Number(settings.getSync('gridCardSize'))}
          cacheType="album"
        />
      )}
    </GenericPage>
  );
};

export default AlbumList;
