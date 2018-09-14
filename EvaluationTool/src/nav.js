import React from 'react';
import { Menu, Dropdown } from 'semantic-ui-react';
import Fields from './fields';
import Select from './select';

const Nav = ({
  selectedFiles,
  fields,
  selectedFields,
  onClickField,
  folders,
  folder,
  setFolder,
  sortBy,
  setSortBy,
  groupBy,
  setGroupBy,
  min,
  setMin,
  max,
  setMax,
  scale,
  setScale,
  interpolate,
  setInterpolate,
  notnull,
  setNotNull,
  average,
  setAverage
}) => (
  <Menu>
    <Menu.Item header>IK Evaluation Tool</Menu.Item>

    <Dropdown item text={`/${folder}`}>
      <Dropdown.Menu>
        {folders.map(x => (
          <Dropdown.Item
            key={x}
            icon={x === folder ? 'folder open outline' : 'folder outline'}
            text={`/${x}`}
            active={x === folder}
            onClick={() => setFolder(x)}
          />
        ))}
      </Dropdown.Menu>
    </Dropdown>

    <Select value={sortBy} setValue={setSortBy} />
    <Select value={groupBy} setValue={setGroupBy} allowNull />

    <Dropdown item text="options">
      <Dropdown.Menu>
        <Dropdown.Item
          icon={scale === 1 || scale === -1 ? 'check' : undefined}
          text="scale (min-max norm)"
          active={scale === 1 || scale === -1}
          onClick={() => setScale(scale === 1 || scale === -1 ? 0 : 1)}
        />
        <Dropdown.Item
          icon={scale === 2 ? 'check' : undefined}
          text="scale (zero-mean/unit-variance standardization)"
          active={scale === 2}
          onClick={() => setScale(scale === 2 ? 0 : 2)}
        />
        <Dropdown.Item
          icon={average ? 'check' : undefined}
          text="average"
          active={!!average}
          onClick={() => setAverage(!average)}
        />
        <Dropdown.Item
          icon={min ? 'check' : undefined}
          text="min"
          active={!!min}
          onClick={() => setMin(!min)}
        />
        <Dropdown.Item
          icon={max ? 'check' : undefined}
          text="max"
          active={!!max}
          onClick={() => setMax(!max)}
        />
        <Dropdown.Item
          icon={interpolate ? 'check' : undefined}
          text="interpolate"
          active={!!interpolate}
          onClick={() => setInterpolate(!interpolate)}
        />
        <Dropdown.Item
          icon={notnull ? 'check' : undefined}
          text="not null"
          active={!!notnull}
          onClick={() => setNotNull(!notnull)}
        />
      </Dropdown.Menu>
    </Dropdown>

    <Fields
      groupBy={groupBy}
      selectedFiles={selectedFiles}
      fields={fields}
      selectedFields={selectedFields}
      onClickField={onClickField}
    />
  </Menu>
);

export default Nav;