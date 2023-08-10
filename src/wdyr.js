import React from 'react';

if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  //@ts-ignore
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    //include: [/Editable/, /ParseqUI/]
    //include: [/Labs/, /WaveSurferComponent/]
    //include: []
  });
}