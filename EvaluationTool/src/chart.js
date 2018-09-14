import React from 'react';
import { compose, withPropsOnChange, withHandlers } from 'recompose';
import { get, groupBy as _groupBy, sortBy as _sortBy } from 'lodash';
import { ResponsiveLine } from './line';
import colorsMaterial from './colors';

const averageDuplicates = (data, searchIndex = 0, values = []) => {
  // searchIndex is at the end
  if (searchIndex >= data.length) return data;

  // search duplicate
  const index = data.findIndex(
    (d, i) => d.x === data[searchIndex].x && i > searchIndex
  );

  // duplicates found
  if (index >= 0) {
    values.push(data[index].y);

    return averageDuplicates(
      data.filter((d, i) => i !== index),
      searchIndex,
      values
    );
  }

  // no more duplicates found
  values.push(data[searchIndex].y);
  const newData = [...data];
  newData[searchIndex] = {
    x: data[searchIndex].x,
    y:
      Math.round(
        (values.reduce((acc, value) => acc + value, 0) / values.length) * 1000
      ) / 1000
  };

  return averageDuplicates(newData, searchIndex + 1, []);
};

const enhance = compose(
  withPropsOnChange(['selectedFiles'], ({ selectedFiles }) => ({
    large: selectedFiles.length > 1
  })),
  withPropsOnChange(
    [
      'files',
      'selectedFiles',
      'selectedFields',
      'sortBy',
      'groupBy',
      'min',
      'max'
    ],
    ({
      files,
      selectedFiles,
      selectedFields,
      sortBy,
      groupBy,
      min,
      max,
      large
    }) => {
      const filteredFiles = files.filter(file =>
        selectedFiles.includes(file.name)
      );

      // group multiple files to one
      if (groupBy) {
        const data = [];
        const groups = _groupBy(filteredFiles, sortBy);

        const extendedFields = [];
        selectedFields.forEach(field => {
          extendedFields.push(field);

          if (min && get(selectedFiles, [0, 'values', `${field} Min`], []))
            extendedFields.push(`${field} Min`);
          if (max && get(selectedFiles, [0, 'values', `${field} Max`], []))
            extendedFields.push(`${field} Max`);
        });

        Object.keys(groups).forEach((group, index) => {
          const xData = {};
          const yData = {};

          groups[group].forEach(file => {
            extendedFields.forEach(field => {
              if (!xData[field]) xData[field] = [];
              if (!yData[field]) yData[field] = [];

              xData[field].push(file[groupBy]);
              yData[field].push(
                get(file, ['values', field], []).reduce(
                  (p, c, i, a) => p + c / a.length,
                  0
                )
              );
            });
          });

          Object.keys(xData).forEach(field => {
            const groupNames = Object.keys(groups);
            let chartData = xData[field].map((x, j) => ({
              x,
              y: Math.round(yData[field][j] * 1000) / 1000
            }));
            chartData = averageDuplicates(chartData);
            chartData = _sortBy(chartData, d => d.x);

            const color =
              groupNames.length > 1
                ? index
                : Object.keys(xData).findIndex(
                    x => x === field.replace(' Min', '').replace(' Max', '')
                  );
            const palette =
              (min && field.includes(' Min')) || (max && field.includes(' Max'))
                ? 1
                : 6;

            data.push({
              id: groupNames.length > 1 ? `${field} [${group}]` : field,
              data: chartData,
              color: get(colorsMaterial, [color, 'palette', palette], 'black')
            });
          });
        });

        return { data };
      }

      // generate min/normal/max-charts
      const data = [];
      filteredFiles.forEach(file => {
        selectedFields.forEach((field, j) => {
          const index = selectedFiles.findIndex(
            fileName => file.name === fileName
          );
          const minValues = min
            ? get(file, ['values', `${field} Min`], [])
            : [];
          const maxValues = max
            ? get(file, ['values', `${field} Max`], [])
            : [];

          if (minValues.length)
            data.push({
              id: !large
                ? `${field} Min`
                : `${field} - #${index + 1} [${sortBy}: ${file[sortBy]}] Min`,
              data: minValues.map((y, x) => ({
                x: x + 1,
                y: parseFloat(y)
              })),
              color: get(
                colorsMaterial,
                [selectedFiles.length === 1 ? j : index, 'palette', 1],
                'black'
              )
            });
          if (maxValues.length)
            data.push({
              id: !large
                ? `${field} Max`
                : `${field} - #${index + 1} [${sortBy}: ${file[sortBy]}] Max`,
              data: maxValues.map((y, x) => ({
                x: x + 1,
                y: parseFloat(y)
              })),
              color: get(
                colorsMaterial,
                [selectedFiles.length === 1 ? j : index, 'palette', 1],
                'black'
              )
            });

          data.push({
            id: !large
              ? field
              : `${field} - #${index + 1} [${sortBy}: ${file[sortBy]}]`,
            data: get(file, ['values', field], []).map((y, x) => ({
              x: x + 1,
              y: parseFloat(y)
            })),
            color: get(
              colorsMaterial,
              [selectedFiles.length === 1 ? j : index, 'palette', 6],
              'black'
            )
          });
        });
      });

      return { data };
    }
  ),
  withPropsOnChange(['scale', 'data'], ({ scale, data }) => ({
    // scale values from 0% to 100%
    data:
      scale === 1 || scale === -1
        ? data.map(d => {
            const ys = d.data.map(({ y }) => y);
            const lowest = Math.min(...ys);
            const highest = Math.max(...ys) - lowest;

            return {
              ...d,
              data: d.data.map(({ x, y }) => ({
                x,
                y: highest
                  ? Math.round(((y - lowest) / highest) * 10000) / 100
                  : y
              }))
            };
          })
        : data
  })),
  withPropsOnChange(
    ['files', 'data', 'groupBy'],
    ({ files, data, groupBy }) => {
      if (files.length === 1 || groupBy) return {};

      // reduce all data to consistent length
      let min;
      data.forEach(d => {
        const length = get(d, ['data', 'length']);
        if (!min || length < min) min = length;
      });

      return { data: data.map(d => ({ ...d, data: d.data.slice(0, min) })) };
    }
  ),
  withPropsOnChange(['data', 'interpolate'], ({ data, interpolate }) => {
    const tickValues = [];
    let min = Infinity;
    let max = 0;

    if (interpolate) {
      const newData = data.map(d => {
        const data2 = [];

        d.data.forEach(({ x, y }, i) => {
          min = x < min ? x : min;
          max = x > max ? x : max;

          if (i) {
            let x0 = d.data[i - 1].x;
            const y0 = d.data[i - 1].y;
            const m = (y - y0) / (x - x0);

            while (Math.round((x - x0) * 100) / 100 > 0.01) {
              x0 += 0.01;

              data2.push({
                x: Math.round(x0 * 100) / 100,
                y: Math.round((y - m * (x - x0)) * 100) / 100
              });
            }
          }

          data2.push({ x, y });
        });

        return {
          ...d,
          data: data2
        };
      });

      for (let i = min; i < max; i += (max - min) / 20)
        tickValues.push(Math.round(i * 100) / 100);
      tickValues.push(Math.round(max * 100) / 100);

      return {
        data: newData,
        tickValues
      };
    }

    return { data, tickValues };
  }),
  withPropsOnChange(['data', 'notnull'], ({ data: d, notnull }) => ({
    data: notnull
      ? d.map(({ data, ...rest }) => ({
          ...rest,
          data: data.filter(({ x }) => x)
        }))
      : d
  })),
  withPropsOnChange(['data', 'scale'], ({ data: d, scale }) => {
    if (scale === 2)
      return {
        data: d.map(({ data, ...rest }) => {
          let mittelwert = 0;
          data.forEach(({ y }) => {
            mittelwert += y;
          });
          mittelwert /= data.length;

          let standardabweichung = 0;
          data.forEach(({ y }) => {
            standardabweichung += (y - mittelwert) ** 2;
          });
          standardabweichung /= data.length;
          standardabweichung = Math.sqrt(standardabweichung);

          return {
            ...rest,
            standardabweichung,
            mittelwert,
            data: data.map(({ x, y }) => ({
              x,
              y:
                Math.round(((y - mittelwert) / standardabweichung) * 1000) /
                1000
            }))
          };
        })
      };

    return { data: d };
  }),
  withPropsOnChange(['data', 'average'], ({ data: d, average: a }) => {
    if (a) {
      const average = {
        id: 'Average',
        color: get(colorsMaterial, [d.length, 'palette', 6], 'black'),
        data: []
      };

      d.forEach(({ data }) => {
        data.forEach(({ x, y }, i) => {
          if (!average.data[i]) average.data[i] = { x, y };
          else average.data[i].y += y;
        });
      });
      average.data = average.data.map(({ x, y }) => ({
        x,
        y: Math.round((y / d.length) * 100) / 100
      }));

      return { data: [...d, average] };
    }

    return {};
  }),
  withPropsOnChange(['data', 'average'], ({ data: d, average }) => {
    const markers = [];

    d.forEach(({ data, id }, i) => {
      let min = Infinity;
      let minX;
      let max = -Infinity;
      let maxX;

      if (id === 'Average' || !average)
        data.forEach(({ x, y }) => {
          if (y < min) {
            min = y;
            minX = x;
          }
          if (y > max) {
            max = y;
            maxX = x;
          }
        });

      if (minX !== undefined) {
        const index = markers.findIndex(m => m.value === minX);

        if (index >= 0) {
          markers[index].legend = 'multiple extrema';
          markers[index].lineStyle.stroke = 'black';
        } else
          markers.push({
            axis: 'x',
            value: minX,
            lineStyle: {
              stroke: get(colorsMaterial, [i, 'palette', 3], 'black'),
              strokeWidth: 1
            },
            legend: `min ${id} [${minX}, ${min}]`,
            legendOrientation: 'vertical'
          });
      }
      if (maxX !== undefined) {
        const index = markers.findIndex(m => m.value === maxX);

        if (index >= 0) {
          markers[index].legend = 'multiple extrema';
          markers[index].lineStyle.stroke = 'black';
        } else
          markers.push({
            axis: 'x',
            value: maxX,
            lineStyle: {
              stroke: get(colorsMaterial, [i, 'palette', 3], 'black'),
              strokeWidth: 1
            },
            legend: `max ${id} [${maxX}, ${max}]`,
            legendOrientation: 'vertical'
          });
      }
    });

    return {
      markers
    };
  }),
  withHandlers({
    tooltipFormat: ({ scale, data }) => (x, i, p) => {
      const { standardabweichung, mittelwert } =
        data.find(({ id }) => id === p.id) || {};

      switch (scale) {
        case -1:
          return `${x}%`;

        case 1:
          return `${x}%`;

        case 2:
          return standardabweichung
            ? `${x} [${Math.round((x * standardabweichung + mittelwert) * 100) /
                100}]`
            : x;

        default:
          return x;
      }
    }
  })
);

const Chart = ({ data, tickValues, markers, large, scale, tooltipFormat }) => {
  const axisBottom = tickValues.length > 1 ? { tickValues } : undefined;

  return (
    <div
      style={{
        flexGrow: 1,
        marginLeft: '1rem',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {!!data.length && (
        <ResponsiveLine
          data={data}
          margin={{
            top: 20,
            right: 25,
            bottom: 50,
            left: 50
          }}
          markers={markers}
          enableDots={false}
          animate
          colorBy={e => e.color}
          axisBottom={axisBottom}
          tooltipFormat={tooltipFormat}
          minY={scale === 2 ? 'auto' : 0}
          legends={[
            {
              anchor: 'bottom-left',
              direction: 'row',
              translateX: -50,
              translateY: 50,
              itemWidth: !large ? 100 : 180,
              itemHeight: 20
            }
          ]}
        />
      )}
    </div>
  );
};

export default enhance(Chart);