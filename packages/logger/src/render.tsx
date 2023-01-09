import React, { useState, useEffect } from "react";
import { render, Text } from "ink";

class Logger extends React.Component {
  constructor(props: {}) {
    super(props);

    this.state = {
      lines: [],
    };
  }

  log(message, status) {
    const line = { message, status };
    this.setState({
      lines: [...this.state.lines, line],
    });
  }

  update(index, message, status) {
    const lines = [...this.state.lines];
    lines[index] = { message, status };
    this.setState({
      lines,
    });
  }

  render() {
    return (
      <div>
        {this.state.lines.map((line, index) => {
          let color;
          if (line.status === "onProgress") {
            color = "yellow";
          } else if (line.status === "succeed") {
            color = "green";
          } else if (line.status === "failed") {
            color = "red";
          } else if (line.status === "elapsedTime") {
            color = "blue";
          }

          return (
            <Text key={index} color={color}>
              {line.message}
            </Text>
          );
        })}
      </div>
    );
  }
}

const logger = new Logger({});
render(logger.render());
