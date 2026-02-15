export const farewellsSections = [
  {
    id: 'album',
    layout: 'split',
    bg: 'assets/img/backgrounds/mi(1)_gr.jpg',
    blocks: [
      {
        type: 'text',
        titleTag: 'h1',
        title: 'Farewells',
        description: 'Farewells — альбом о прощании со сном. Мы старались передать желание вернуться в теплое прошлое, в воспоминание, которое не получается забыть до конца. Многие сталкивались с моментом, когда невыразимо хотелось вернуться назад. Но прошлое осталось только начертанием в голове, почти забытым. Его больше не получится пережить, послушать, пересмотреть. Только вспоминать.',
        descriptionClass: 'text-uppercase letter-spacing-wide accent-color mb-40'
      },
      {
        type: 'player',
        audioSrc: 'assets/music/till_the_end.mp3',
        artworkSrc: 'assets/img/album/album_cover.jpg',
        trackTitle: 'Till The End',
        trackArtist: 'мelatonin*'
      }
    ]
  },
  {
    id: 'promo',
    layout: 'quad',
    bg: 'assets/img/backgrounds/mi(1)_bl.jpg',
    blocks: [
      {
        type: 'text',
        titleTag: 'h1',
        title: 'Promo',
        description: 'В качестве промо для альбома мы выпустили серию роликов в социальных сетях со звуком с концертов',
        descriptionClass: 'text-uppercase letter-spacing-wide accent-color mb-40'
      },
      {
        type: 'grid',
        gridClass: 'grid-2-fill',
        items: [
          {
            type: 'media',
            mediaType: 'image',
            src: 'assets/img/posters/motri_afisha.jpg',
            alt: 'Concert Photo 1',
            ariaLabel: 'View concert photo',
            ratio: '1-1',
            fit: 'cover',
            lightbox: true
          },
          {
            type: 'media',
            mediaType: 'image',
            src: 'assets/img/posters/perspektiva_afisha.png',
            alt: 'Concert Photo 2',
            ariaLabel: 'View concert photo',
            ratio: '1-1',
            fit: 'cover',
            lightbox: true
          }
        ]
      },
      {
        type: 'media',
        mediaType: 'video',
        src: 'assets/video/promo_1',
        ratio: '16-9'
      },
      {
        type: 'media',
        mediaType: 'video',
        src: 'assets/video/promo_2',
        ratio: '16-9'
      }
    ]
  },
  {
    id: 'live',
    layout: 'quad',
    bg: 'assets/img/backgrounds/mi(1)_yl.jpg',
    blocks: [
      {
        type: 'text',
        titleTag: 'h1',
        title: 'Live Performance',
        titleClass: 'large-heading',
        description: 'Записи с выступлений, живой звук и атмосфера',
        descriptionClass: 'text-uppercase letter-spacing-wide accent-color mb-40'
      },
      {
        type: 'media',
        mediaType: 'video',
        src: 'assets/video/live_motri_1',
        ratio: '16-9'
      },
      {
        type: 'media',
        mediaType: 'video',
        src: 'assets/video/live_perspektiva_1',
        ratio: '16-9'
      },
      {
        type: 'media',
        mediaType: 'video',
        src: 'assets/video/live_perspektiva_2',
        ratio: '16-9'
      }
    ]
  }
];
