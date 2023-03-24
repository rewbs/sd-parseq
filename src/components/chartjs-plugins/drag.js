// Forked from https://github.com/chrispahm/chartjs-plugin-dragdata
// to attent to fix for latest chart.js
import {Chart} from 'chart.js'
import {drag} from 'd3-drag'
import {select} from 'd3-selection'

let element, yAxisID, xAxisID, rAxisID, type, stacked, floatingBar, initValue, curDatasetIndex, curIndex, eventSettings
let isDragging = false

function getSafe(func) {
  try {
    return func()
  } catch (e) {
    return ''
  }
}

const getElement = (e, chartInstance, callback) => {  
  element = chartInstance.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false)[0]
  type = chartInstance.config.type

  if (element) {    
    let datasetIndex = element.datasetIndex
    let index = element.index
    // save element settings
    eventSettings = getSafe(() => chartInstance.config.options.plugins.tooltip.animation)

    const dataset = chartInstance.data.datasets[datasetIndex]
    const datasetMeta = chartInstance.getDatasetMeta(datasetIndex)
    let curValue = dataset.data[index]
    // get the id of the datasets scale
    xAxisID = datasetMeta.xAxisID
    yAxisID = datasetMeta.yAxisID
    rAxisID = datasetMeta.rAxisID
    
    // check if dragging the dataset or datapoint is prohibited
    if (dataset.dragData === false || 
      (chartInstance.config.options.scales[xAxisID] && chartInstance.config.options.scales[xAxisID].dragData === false) ||
      (chartInstance.config.options.scales[yAxisID] && chartInstance.config.options.scales[yAxisID].dragData === false) ||
      (chartInstance.config.options.scales[rAxisID] && chartInstance.config.options.scales[rAxisID].rAxisID === false) ||
      dataset.data[element.index].dragData === false
    ) {
      element = null
      return
    }

    if (type === 'bar') {
      stacked = chartInstance.config.options.scales[xAxisID].stacked

      // if a bar has a data point that is an array of length 2, it's a floating bar
      const samplePoint = chartInstance.data.datasets[0].data[0]
      floatingBar = (samplePoint !== null) && Array.isArray(samplePoint) && samplePoint.length === 2

      let data = {}
      let newPos = calcPosition(e, chartInstance, datasetIndex, index, data)
      initValue = newPos - curValue      
    }

    // disable the tooltip animation
    if (chartInstance.config.options.plugins.dragData.showTooltip === undefined || chartInstance.config.options.plugins.dragData.showTooltip) {
      if (!chartInstance.config.options.plugins.tooltip) chartInstance.config.options.plugins.tooltip = {}
      chartInstance.config.options.plugins.tooltip.animation = false
    }    
    
    if (typeof callback === 'function' && element) {
      if (callback(e, datasetIndex, index, curValue) === false) {
        element = null
      }
    }
  }
}

function roundValue(value, pos) {
  if (!isNaN(pos)) {
    return Math.round(value * Math.pow(10, pos)) / Math.pow(10, pos)
  }
  return value
}

function calcRadar(e, chartInstance) {
  let x, y, v
  if (e.touches) {
    x = e.touches[0].clientX - chartInstance.canvas.getBoundingClientRect().left
    y = e.touches[0].clientY - chartInstance.canvas.getBoundingClientRect().top
  } else {
    x = e.clientX - chartInstance.canvas.getBoundingClientRect().left
    y = e.clientY - chartInstance.canvas.getBoundingClientRect().top
  }
  let rScale = chartInstance.scales[rAxisID]
  let d = Math.sqrt(Math.pow(x - rScale.xCenter, 2) + Math.pow(y - rScale.yCenter, 2))
  let scalingFactor = rScale.drawingArea / (rScale.max - rScale.min)
  if (rScale.options.ticks.reverse) {
    v = rScale.max - (d / scalingFactor)
  } else {
    v = rScale.min + (d / scalingFactor)
  }

  v = roundValue(v, chartInstance.config.options.plugins.dragData.round)

  v = v > chartInstance.scales[rAxisID].max ? chartInstance.scales[rAxisID].max : v
  v = v < chartInstance.scales[rAxisID].min ? chartInstance.scales[rAxisID].min : v

  return v
}

function calcPosition(e, chartInstance, datasetIndex, index, data) {
  let x, y
  const dataPoint = chartInstance.data.datasets[datasetIndex].data[index]
  
  if (e.touches) {
    x = chartInstance.scales[xAxisID].getValueForPixel(e.touches[0].clientX - chartInstance.canvas.getBoundingClientRect().left)
    y = chartInstance.scales[yAxisID].getValueForPixel(e.touches[0].clientY - chartInstance.canvas.getBoundingClientRect().top)
  } else {
    x = chartInstance.scales[xAxisID].getValueForPixel(e.clientX - chartInstance.canvas.getBoundingClientRect().left)
    y = chartInstance.scales[yAxisID].getValueForPixel(e.clientY - chartInstance.canvas.getBoundingClientRect().top)
  }
  
  x = roundValue(x, chartInstance.config.options.plugins.dragData.round)
  y = roundValue(y, chartInstance.config.options.plugins.dragData.round)
  
  x = x > chartInstance.scales[xAxisID].max ? chartInstance.scales[xAxisID].max : x
  x = x < chartInstance.scales[xAxisID].min ? chartInstance.scales[xAxisID].min : x

  y = y > chartInstance.scales[yAxisID].max ? chartInstance.scales[yAxisID].max : y
  y = y < chartInstance.scales[yAxisID].min ? chartInstance.scales[yAxisID].min : y

  
  if (floatingBar) {
    // x contains the new value for one end of the floating bar
    // dataPoint contains the old interval [left, right] of the floating bar
    // calculate difference between the new value and both sides
    // the side with the smallest difference from the new value was the one that was dragged
    // return an interval with new value on the dragged side and old value on the other side
    let newVal
    // choose the right variable based on the orientation of the graph(vertical, horizontal)
    if (chartInstance.config.options.indexAxis === 'y') {
      newVal = x
    } else {
      newVal = y
    }
    const diffFromLeft = Math.abs(newVal - dataPoint[0])
    const diffFromRight = Math.abs(newVal - dataPoint[1])

    if (diffFromLeft <= diffFromRight) {
      return [newVal, dataPoint[1]]
    } else {
      return [dataPoint[0], newVal]
    }
  }

  if (dataPoint.x !== undefined && chartInstance.config.options.plugins.dragData.dragX) {
    dataPoint.x = x
  }
  
  if (dataPoint.y !== undefined) {
    if (chartInstance.config.options.plugins.dragData.dragY !== false) {
      dataPoint.y = y
    }  
    return dataPoint
  } else {
    if (chartInstance.config.options.indexAxis === 'y') {
      return x
    } else {
      return y
    }
  }
}

const updateData = (e, chartInstance, pluginOptions, callback) => {
  if (element) {
    curDatasetIndex = element.datasetIndex
    curIndex = element.index
    
    isDragging = true
    
    let dataPoint = chartInstance.data.datasets[curDatasetIndex].data[curIndex]

    if (type === 'radar' || type === 'polarArea') {
      dataPoint = calcRadar(e, chartInstance)
    } else if (stacked) {
      let cursorPos = calcPosition(e, chartInstance, curDatasetIndex, curIndex, dataPoint)
      dataPoint = roundValue(cursorPos - initValue, pluginOptions.round)
    } else if (floatingBar) {
      dataPoint = calcPosition(e, chartInstance, curDatasetIndex, curIndex, dataPoint)
    } else {
      dataPoint = calcPosition(e, chartInstance, curDatasetIndex, curIndex, dataPoint)
    }
        
    if (!callback || (typeof callback === 'function' && callback(e, curDatasetIndex, curIndex, dataPoint) !== false)) {
      chartInstance.data.datasets[curDatasetIndex].data[curIndex] = dataPoint
      chartInstance.update('none')
    }
  }
}

// Update values to the nearest values
function applyMagnet(chartInstance, i, j) {
  const pluginOptions = chartInstance.config.options.plugins.dragData
  if (pluginOptions.magnet) {
    const magnet = pluginOptions.magnet
    if (magnet.to && typeof magnet.to === 'function') {
      let data = chartInstance.data.datasets[i].data[j]
      data = magnet.to(data)
      chartInstance.data.datasets[i].data[j] = data
      chartInstance.update('none')
      return data
    }
  } else {
    return chartInstance.data.datasets[i].data[j]
  }
}

const dragEndCallback = (e, chartInstance, callback) => {
  curDatasetIndex = undefined;
  curIndex = undefined;
  isDragging = false
  // re-enable the tooltip animation
  if (chartInstance.config.options.plugins.tooltip) {
    chartInstance.config.options.plugins.tooltip.animation = eventSettings
    chartInstance.update('none')
  }
  
  // chartInstance.update('none')
  if (typeof callback === 'function' && element) {
    const datasetIndex = element.datasetIndex
    const index = element.index
    let value = applyMagnet(chartInstance, datasetIndex, index)
    return callback(e, datasetIndex, index, value)
  }
}

const ChartJSdragDataPlugin = {
  id: 'dragdata',
  afterInit: function (chartInstance) {    
    if (chartInstance.config.options.plugins && chartInstance.config.options.plugins.dragData) {
      const pluginOptions = chartInstance.config.options.plugins.dragData
      select(chartInstance.canvas).call(
        drag().container(chartInstance.canvas)
          .on('start', e => getElement(e.sourceEvent, chartInstance, pluginOptions.onDragStart))
          .on('drag', e => updateData(e.sourceEvent, chartInstance, pluginOptions, pluginOptions.onDrag))
          .on('end', e => dragEndCallback(e.sourceEvent, chartInstance, pluginOptions.onDragEnd))
      )
    }
  },
  beforeEvent: function (chart) {
    if (isDragging) {
    	if (chart.tooltip) chart.tooltip.update();
      return false
    }
  },
}
Chart.register(ChartJSdragDataPlugin)

export default ChartJSdragDataPlugin