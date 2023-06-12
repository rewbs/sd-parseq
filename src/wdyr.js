import React from 'react';

if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  //@ts-ignore
  whyDidYouRender(React, {
    trackAllPureComponents: false,
    //include: [/Editable/, /ParseqUI/]
    //include: [/AgGridReact/]
    include: []
  });
}