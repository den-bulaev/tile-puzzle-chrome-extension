import { ChangeEvent } from "react";
import { ISelect } from "../../utils";

import "./Select.css";

interface ISelectProps {
  handleChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  value: string;
  defaultOptionText: string;
  options: ISelect[];
}

const Select = (props: ISelectProps) => {
  const { handleChange, value, options, defaultOptionText } = props;

  return (
    <select className="select" onChange={handleChange} value={value}>
      <option className="select_default-option" value="">
        {defaultOptionText}
      </option>
      {options.map((item) => (
        <option value={item.value} key={item.text}>
          {item.text}
        </option>
      ))}
    </select>
  );
};

export default Select;
