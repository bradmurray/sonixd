import React, { useState, useEffect } from 'react';
import { getAlbums } from '../../api/api';
import Loader from '../loader/Loader';
import GenericPage from '../layout/GenericPage';
import GenericPageHeader from '../layout/GenericPageHeader';
import ScrollingMenu from '../scrollingmenu/ScrollingMenu';

const Dashboard = () => {
  /* We use regular state and fetching via axios for the dashboard component as
   the horizontal scrolling menu component breaks due to react-query's autofetching.
   When autofetching occurs, the visibility context of the component fails to update
   which prevents the left/right scrolling buttons from functioning properly. */
  const [recentAlbums, setRecentAlbums]: any[] = useState(null);
  const [newestAlbums, setNewestAlbums]: any[] = useState(null);
  const [randomAlbums, setRandomAlbums]: any[] = useState(null);
  const [frequentAlbums, setFrequentAlbums]: any[] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError]: any = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const newest = await getAlbums({ type: 'newest', size: 20 }, 250);
        const recent = await getAlbums({ type: 'recent', size: 20 }, 250);
        const random = await getAlbums({ type: 'random', size: 20 }, 250);
        const frequent = await getAlbums({ type: 'frequent', size: 20 }, 250);

        setNewestAlbums(newest);
        setRecentAlbums(recent);
        setRandomAlbums(random);
        setFrequentAlbums(frequent);
      } catch (err) {
        if (err instanceof Error) {
          setIsError(err.message);
        } else {
          setIsError('An unknown error occurred while fetching the data.');
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <GenericPage header={<GenericPageHeader title="Dashboard" />}>
        <Loader />
      </GenericPage>
    );
  }

  if (isError) {
    return (
      <GenericPage header={<GenericPageHeader title="Dashboard" />}>
        <span>Error: {isError}</span>
      </GenericPage>
    );
  }

  return (
    <GenericPage header={<GenericPageHeader title="Dashboard" />}>
      {newestAlbums && recentAlbums && randomAlbums && (
        <>
          <ScrollingMenu
            title="Recently Played"
            data={recentAlbums.album}
            cardTitle={{ prefix: 'album', property: 'name' }}
            cardSubtitle={{ prefix: 'album', property: 'artist' }}
            cardSize="175px"
          />

          <ScrollingMenu
            title="Recently Added"
            data={newestAlbums.album}
            cardTitle={{ prefix: 'album', property: 'name' }}
            cardSubtitle={{ prefix: 'album', property: 'artist' }}
            cardSize="175px"
          />

          <ScrollingMenu
            title="Random"
            data={randomAlbums.album}
            cardTitle={{ prefix: 'album', property: 'name' }}
            cardSubtitle={{ prefix: 'album', property: 'artist' }}
            cardSize="175px"
          />

          <ScrollingMenu
            title="Most Played"
            data={frequentAlbums.album}
            cardTitle={{ prefix: 'album', property: 'name' }}
            cardSubtitle={{ prefix: 'album', property: 'artist' }}
            cardSize="175px"
          />
        </>
      )}
    </GenericPage>
  );
};

export default Dashboard;