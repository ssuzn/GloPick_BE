import { JOB_FIELDS } from "../constants/dropdownOptions";
import { createFlightLinks } from "../utils/flightLinkGenerator";
import {
  toInitialBudgetEnum,
  toDepartureAirportEnum,
} from "../utils/simulationValidator";
import { SaveSimulationParams } from "../types/simulation";
import { SimulationInputService } from "./simulation/SimulationInputService";
import { SimulationResultService } from "./simulation/SimulationResultService";
import { SimulationInput, SimulationResult } from "../generated/prisma/client";
import { SimulationListService } from "./simulation/SimulationListService";
import { SimulationMapper } from "../mappers/SimulationMapper";

export class SimulationService {
  static getDesiredJobName = (desiredJob?: string | null) => {
    const jobCode = desiredJob ? desiredJob.replace("JOB_", "") : "2";
    const jobField =
      JOB_FIELDS.find((field) => field.code === jobCode) || JOB_FIELDS[1];

    return jobField.nameKo;
  };

  private static async findExistingSimulation(
    input: SimulationInput,
    userId: number,
    cityIndex: number,
    initialBudget: string,
    requiredFacilities: string[],
    departureAirport: string,
  ) {
    const actualSelectedCity = input.recommendedCities[cityIndex];

    const existingInputs =
      await SimulationInputService.findCompletedSimulationInputs(
        userId,
        input.profileId,
        input.selectedCountry,
      );

    const sortedRequiredFacilities = [...requiredFacilities].sort().join(",");

    const existingInput = existingInputs.find((existing) => {
      const sortedExisting = [...(existing.requiredFacilities || [])]
        .sort()
        .join(",");

      return (
        existing.selectedCity === actualSelectedCity &&
        existing.initialBudget === toInitialBudgetEnum(initialBudget) &&
        existing.departureAirport ===
          toDepartureAirportEnum(departureAirport) &&
        sortedExisting === sortedRequiredFacilities
      );
    });

    if (!existingInput) {
      return null;
    }

    const existingSimulation =
      await SimulationResultService.findSimulationResult(
        existingInput.id,
        userId,
      );

    if (!existingSimulation) {
      return null;
    }

    return {
      input: existingInput,
      simulation: existingSimulation,
      city: actualSelectedCity,
    };
  }

  private static async saveSimulationList(
    userId: number,
    profileId: number,
    selectedCountry: string,
    selectedCity: string,
  ) {
    const userProfile = await SimulationInputService.findUserProfile(
      profileId,
      userId,
    );

    const desiredJob = this.getDesiredJobName(userProfile?.desiredJob);

    const exists = await SimulationListService.findSimulationListItem(
      userId,
      desiredJob,
      selectedCountry,
      selectedCity,
    );

    if (!exists) {
      await SimulationListService.createSimulationListItem(
        userId,
        desiredJob,
        selectedCountry,
        selectedCity,
      );
    }
  }

  private static buildExistingSimulationResponse(
    input: SimulationInput,
    simulation: SimulationResult,
    departureAirport: string,
  ) {
    return {
      isExisting: true,
      inputId: input.id,
      simulationId: simulation.id,
      result: SimulationMapper.toResponse(simulation),
      flightLinks: createFlightLinks(departureAirport, input.selectedCity!),
    };
  }

  static async saveSimulation(params: SaveSimulationParams) {
    const {
      input,
      userId,
      cityIndex,
      initialBudget,
      requiredFacilities,
      departureAirport,
    } = params;

    const existing = await this.findExistingSimulation(
      input,
      userId,
      cityIndex,
      initialBudget,
      requiredFacilities,
      departureAirport,
    );

    if (existing) {
      return this.buildExistingSimulationResponse(
        existing.input,
        existing.simulation,
        departureAirport,
      );
    }

    const selectedCity = input.recommendedCities[cityIndex];

    const updatedInput = await SimulationInputService.updateSimulationInput(
      input.id,
      {
        selectedCity,
        initialBudget: toInitialBudgetEnum(initialBudget),
        requiredFacilities,
        departureAirport: toDepartureAirportEnum(departureAirport),
      },
    );

    const generated = await SimulationResultService.generateSimulationResult({
      input: updatedInput,
      userId,
      departureAirport,
      selectedCity,
    });

    await this.saveSimulationList(
      userId,
      updatedInput.profileId,
      updatedInput.selectedCountry,
      selectedCity,
    );

    return {
      isExisting: false,
      inputId: updatedInput.id,
      ...generated,
    };
  }
}
