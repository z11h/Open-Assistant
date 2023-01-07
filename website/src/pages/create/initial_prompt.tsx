import { Container } from "@chakra-ui/react";
import { useColorMode } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LoadingScreen } from "src/components/Loading/LoadingScreen";
import { TaskControls } from "src/components/Survey/TaskControls";
import { TrackedTextarea } from "src/components/Survey/TrackedTextarea";
import { TwoColumnsWithCards } from "src/components/Survey/TwoColumnsWithCards";
import fetcher from "src/lib/fetcher";
import poster from "src/lib/poster";
import useSWRImmutable from "swr/immutable";
import useSWRMutation from "swr/mutation";

const InitialPrompt = () => {
  const [tasks, setTasks] = useState([]);
  const [inputText, setInputText] = useState("");

  const { isLoading, mutate } = useSWRImmutable("/api/new_task/initial_prompt ", fetcher, {
    onSuccess: (data) => {
      setTasks([data]);
    },
  });

  const { trigger } = useSWRMutation("/api/update_task", poster, {
    onSuccess: async (data) => {
      const newTask = await data.json();
      setTasks((oldTasks) => [...oldTasks, newTask]);
    },
  });

  useEffect(() => {
    if (tasks.length == 0) {
      mutate();
    }
  }, [tasks]);

  const submitResponse = (task: { id: string }) => {
    const text = inputText.trim();
    trigger({
      id: task.id,
      update_type: "text_reply_to_message",
      content: {
        text,
      },
    });
  };

  const fetchNextTask = () => {
    setInputText("");
    mutate();
  };

  const textChangeHandler = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(event.target.value);
  };

  const { colorMode } = useColorMode();
  const mainBgClasses = colorMode === "light" ? "bg-slate-300 text-gray-800" : "bg-slate-900 text-white";

  if (isLoading) {
    return <LoadingScreen text="Loading..." />;
  }

  if (tasks.length == 0) {
    return <Container className="p-6 text-center text-gray-800">No tasks found...</Container>;
  }

  return (
    <div className={`p-12 ${mainBgClasses}`}>
      <TwoColumnsWithCards>
        <>
          <h5 className="text-lg font-semibold">Start a conversation</h5>
          <p className="text-lg py-1">Create an initial message to send to the assistant</p>
        </>
        <>
          <h5 className="text-lg font-semibold">Provide the initial prompt</h5>
          <TrackedTextarea
            text={inputText}
            onTextChange={textChangeHandler}
            thresholds={{ low: 20, medium: 40, goal: 50 }}
            textareaProps={{ placeholder: "Question, task, greeting or similar..." }}
          />
        </>
      </TwoColumnsWithCards>

      <TaskControls tasks={tasks} onSubmitResponse={submitResponse} onSkip={fetchNextTask} />
    </div>
  );
};

export default InitialPrompt;
